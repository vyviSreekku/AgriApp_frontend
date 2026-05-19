import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';
import { Buffer } from 'buffer';

import { getApiUrl } from '../utils/config';

const getOfflineRagBundleUrl = async () => {
  const baseUrl = await getApiUrl();
  return `${baseUrl}/chatbot/offline-rag-bundle`;
};

const EMBEDDING_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_MODEL_URL = `https://huggingface.co/${EMBEDDING_MODEL_ID}/resolve/main/onnx/model_quantized.onnx`;
const TOKENIZER_URL = `https://huggingface.co/${EMBEDDING_MODEL_ID}/resolve/main/tokenizer.json`;
const TOKENIZER_CONFIG_URL = `https://huggingface.co/${EMBEDDING_MODEL_ID}/resolve/main/tokenizer_config.json`;

const OFFLINE_RAG_DIR = `${RNFS.DocumentDirectoryPath}/offline-rag`;
const EMBEDDING_MODEL_PATH = `${OFFLINE_RAG_DIR}/model_quantized.onnx`;
const TOKENIZER_PATH = `${OFFLINE_RAG_DIR}/tokenizer.json`;
const TOKENIZER_CONFIG_PATH = `${OFFLINE_RAG_DIR}/tokenizer_config.json`;
const RAG_BUNDLE_PATH = `${OFFLINE_RAG_DIR}/offline-rag-bundle.json`;

const MAX_QUERY_TOKENS = 128;
const DEFAULT_TOP_K = 1;
const MAX_CONTEXT_CHARS = 900;
const MAX_FIELD_VALUE_CHARS = 180;
const MAX_LOG_PREVIEW_CHARS = 140;
const ENABLE_NATIVE_QUERY_EMBEDDING = true;
const MIN_TERM_LENGTH = 2;
const MAX_SIMPLE_QUERY_WORDS = 8;
const MIN_LEXICAL_SCORE = 6;
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'if', 'in', 'is', 'it', 'of', 'on', 'or',
  'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'which', 'with', 'you', 'your', 'can', 'i', 'me', 'my',
  'about', 'tell', 'please', 'explain', 'details', 'detail', 'information',
]);

let embeddingSessionPromise = null;
let tokenizerPromise = null;
let ragBundlePromise = null;
let ragBundleCache = null;
let onnxRuntimeModule = null;
let tokenizerModule = null;
let warnedAboutUnavailableRuntime = false;
let warnedAboutDisabledEmbedding = false;

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const hasOnnxRuntimeBinding = () => Boolean(NativeModules?.Onnxruntime);

const warnUnavailableRuntime = () => {
  if (warnedAboutUnavailableRuntime) {
    return;
  }

  warnedAboutUnavailableRuntime = true;
  console.warn('Offline RAG embedding is unavailable because onnxruntime-react-native is not installed in the current native build.');
};

const warnDisabledEmbedding = () => {
  if (warnedAboutDisabledEmbedding) {
    return;
  }

  warnedAboutDisabledEmbedding = true;
  console.log('Offline RAG is using lexical retrieval because native query embedding is disabled for stability.');
};

const getOnnxRuntimeModule = () => {
  if (!ENABLE_NATIVE_QUERY_EMBEDDING) {
    warnDisabledEmbedding();
    return null;
  }

  if (!hasOnnxRuntimeBinding()) {
    warnUnavailableRuntime();
    return null;
  }

  if (!onnxRuntimeModule) {
    // Require lazily so app startup does not crash when the native bridge is absent.
    // eslint-disable-next-line global-require
    onnxRuntimeModule = require('onnxruntime-react-native');
  }

  return onnxRuntimeModule;
};

const getTokenizerModule = () => {
  if (!ENABLE_NATIVE_QUERY_EMBEDDING) {
    warnDisabledEmbedding();
    return null;
  }

  if (!tokenizerModule) {
    // eslint-disable-next-line global-require
    tokenizerModule = require('@huggingface/tokenizers');
  }

  return tokenizerModule;
};

const ensureDirectory = async () => {
  const exists = await RNFS.exists(OFFLINE_RAG_DIR);
  if (!exists) {
    console.log(`Creating offline RAG directory at ${OFFLINE_RAG_DIR}`);
    await RNFS.mkdir(OFFLINE_RAG_DIR);
  }
};

const readBundleFileInfo = async () => {
  const exists = await RNFS.exists(RAG_BUNDLE_PATH);
  if (!exists) {
    return {
      exists: false,
      path: RAG_BUNDLE_PATH,
      size: 0,
      sizeLabel: '0 B',
      mtime: null,
    };
  }

  const stat = await RNFS.stat(RAG_BUNDLE_PATH);
  const size = Number(stat.size || 0);

  return {
    exists: true,
    path: RAG_BUNDLE_PATH,
    size,
    sizeLabel: formatBytes(size),
    mtime: stat.mtime || null,
  };
};

const downloadIfMissing = async (url, destinationPath) => {
  const exists = await RNFS.exists(destinationPath);
  if (exists) {
    return destinationPath;
  }

  const result = await RNFS.downloadFile({
    fromUrl: url,
    toFile: destinationPath,
    background: true,
    discretionary: true,
  }).promise;

  if (result.statusCode !== 200) {
    await RNFS.unlink(destinationPath).catch(() => {});
    throw new Error(`Failed to download ${url} (${result.statusCode})`);
  }

  return destinationPath;
};

const downloadFreshFile = async (url, destinationPath) => {
  await RNFS.unlink(destinationPath).catch(() => {});
  return downloadIfMissing(url, destinationPath);
};

const ensureTokenizer = async () => {
  if (!tokenizerPromise) {
    tokenizerPromise = (async () => {
      const tokenizerLib = getTokenizerModule();
      if (!tokenizerLib?.Tokenizer) {
        return null;
      }

      await ensureDirectory();
      await downloadIfMissing(TOKENIZER_URL, TOKENIZER_PATH);
      await downloadIfMissing(TOKENIZER_CONFIG_URL, TOKENIZER_CONFIG_PATH);

      const [tokenizerJsonText, tokenizerConfigText] = await Promise.all([
        RNFS.readFile(TOKENIZER_PATH, 'utf8'),
        RNFS.readFile(TOKENIZER_CONFIG_PATH, 'utf8'),
      ]);

      return new tokenizerLib.Tokenizer(JSON.parse(tokenizerJsonText), JSON.parse(tokenizerConfigText));
    })().catch((error) => {
      tokenizerPromise = null;
      throw error;
    });
  }

  return tokenizerPromise;
};

const ensureEmbeddingSession = async () => {
  if (!embeddingSessionPromise) {
    embeddingSessionPromise = (async () => {
      const onnxRuntime = getOnnxRuntimeModule();
      if (!onnxRuntime) {
        return null;
      }

      const { InferenceSession } = onnxRuntime;
      await ensureDirectory();
      await downloadIfMissing(EMBEDDING_MODEL_URL, EMBEDDING_MODEL_PATH);

      try {
        return await InferenceSession.create(EMBEDDING_MODEL_PATH, {
          executionProviders: ['cpu'],
          graphOptimizationLevel: 'all',
          intraOpNumThreads: 2,
          interOpNumThreads: 1,
          enableCpuMemArena: true,
          enableMemPattern: true,
        });
      } catch (error) {
        console.warn('Offline RAG embedding model failed to load, redownloading once:', error?.message || error);
        await downloadFreshFile(EMBEDDING_MODEL_URL, EMBEDDING_MODEL_PATH);

        return InferenceSession.create(EMBEDDING_MODEL_PATH, {
          executionProviders: ['cpu'],
          graphOptimizationLevel: 'all',
          intraOpNumThreads: 2,
          interOpNumThreads: 1,
          enableCpuMemArena: true,
          enableMemPattern: true,
        });
      }
    })().catch((error) => {
      embeddingSessionPromise = null;
      throw error;
    });
  }

  return embeddingSessionPromise;
};

const normalizeVector = (vector) => {
  let magnitude = 0;
  for (let index = 0; index < vector.length; index += 1) {
    magnitude += vector[index] * vector[index];
  }

  if (magnitude <= 0) {
    return vector;
  }

  const scale = Math.sqrt(magnitude);
  const normalized = new Float32Array(vector.length);
  for (let index = 0; index < vector.length; index += 1) {
    normalized[index] = vector[index] / scale;
  }

  return normalized;
};

const meanPool = (tensor, attentionMask) => {
  const dims = tensor.dims ?? [];
  const data = tensor.data;

  if (dims.length !== 3) {
    throw new Error(`Unexpected embedding output shape: ${JSON.stringify(dims)}`);
  }

  const sequenceLength = dims[1];
  const hiddenSize = dims[2];
  const pooled = new Float32Array(hiddenSize);
  let tokenCount = 0;

  for (let tokenIndex = 0; tokenIndex < sequenceLength; tokenIndex += 1) {
    if (!attentionMask[tokenIndex]) {
      continue;
    }

    tokenCount += 1;
    const baseOffset = tokenIndex * hiddenSize;
    for (let hiddenIndex = 0; hiddenIndex < hiddenSize; hiddenIndex += 1) {
      pooled[hiddenIndex] += data[baseOffset + hiddenIndex];
    }
  }

  if (tokenCount > 0) {
    for (let hiddenIndex = 0; hiddenIndex < hiddenSize; hiddenIndex += 1) {
      pooled[hiddenIndex] /= tokenCount;
    }
  }

  return normalizeVector(pooled);
};

const buildInt64Tensor = (TensorCtor, values) => new TensorCtor('int64', BigInt64Array.from(values, (value) => BigInt(value)), [1, values.length]);

const encodeQuery = async (query) => {
  const tokenizer = await ensureTokenizer();
  if (!tokenizer) {
    return null;
  }

  const encoded = tokenizer.encode(query);

  const ids = encoded.ids.slice(0, MAX_QUERY_TOKENS);
  const attentionMask = encoded.attention_mask.slice(0, MAX_QUERY_TOKENS);
  const tokenTypeIds = (encoded.token_type_ids ?? []).slice(0, MAX_QUERY_TOKENS);

  while (tokenTypeIds.length < ids.length) {
    tokenTypeIds.push(0);
  }

  return {
    ids,
    attentionMask,
    tokenTypeIds,
  };
};

const embedQuery = async (query) => {
  const onnxRuntime = getOnnxRuntimeModule();
  if (!onnxRuntime) {
    return null;
  }

  const { Tensor } = onnxRuntime;
  const session = await ensureEmbeddingSession();
  if (!session) {
    return null;
  }

  const encoded = await encodeQuery(query);
  if (!encoded) {
    return null;
  }

  const feeds = {};
  for (const inputName of session.inputNames) {
    if (inputName.includes('input_ids')) {
      feeds[inputName] = buildInt64Tensor(Tensor, encoded.ids);
    } else if (inputName.includes('attention_mask')) {
      feeds[inputName] = buildInt64Tensor(Tensor, encoded.attentionMask);
    } else if (inputName.includes('token_type_ids')) {
      feeds[inputName] = buildInt64Tensor(Tensor, encoded.tokenTypeIds);
    }
  }

  const outputs = await session.run(feeds);
  const firstOutputName = session.outputNames[0];
  const firstOutput = outputs[firstOutputName];

  if (!firstOutput) {
    throw new Error('Embedding model returned no outputs');
  }

  return meanPool(firstOutput, encoded.attentionMask);
};

const normalizeText = (text) => (text || '').toLowerCase();

const extractTerms = (text) => normalizeText(text)
  .split(/[^a-z0-9]+/)
  .filter((term) => term.length >= MIN_TERM_LENGTH && !STOP_WORDS.has(term));

const buildQueryProfile = (query) => {
  const terms = extractTerms(query);
  const uniqueTerms = [...new Set(terms)];

  return {
    raw: normalizeText(query).trim(),
    terms,
    uniqueTerms,
    uniqueTermSet: new Set(uniqueTerms),
  };
};

const scoreChunkLexically = (queryProfile, chunkContent) => {
  const normalizedChunk = normalizeText(chunkContent);
  if (!normalizedChunk) {
    return 0;
  }

  const chunkTerms = extractTerms(normalizedChunk);
  if (!chunkTerms.length) {
    return 0;
  }

  const chunkTermSet = new Set(chunkTerms);
  let overlapCount = 0;
  let frequencyScore = 0;

  for (const term of queryProfile.uniqueTerms) {
    if (chunkTermSet.has(term)) {
      overlapCount += 1;
    }
  }

  for (const term of queryProfile.terms) {
    if (normalizedChunk.includes(term)) {
      frequencyScore += 1;
    }
  }

  let phraseBonus = 0;
  if (queryProfile.raw && queryProfile.raw.length >= 8 && normalizedChunk.includes(queryProfile.raw)) {
    phraseBonus = 4;
  }

  return (overlapCount * 3) + frequencyScore + phraseBonus;
};

const titleCase = (value) => value
  .split(' ')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const prettifyKey = (key) => {
  const normalized = key
    .replace(/[/.]+/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const aliasMap = {
    'plant/crop group': 'Crop group',
    plant_host: 'Host crop',
    biological_name: 'Scientific name',
    disease_class: 'Disease class',
    pathogen_type: 'Pathogen type',
    affected_parts: 'Affected parts',
    favorable_conditions: 'Favorable conditions',
    management_cultural: 'Cultural management',
    management_chemical: 'Chemical management',
    management_biological: 'Biological management',
    damage_symptoms: 'Symptoms',
    common_name: 'Common name',
    resistance_varieties: 'Resistant varieties',
  };

  return aliasMap[normalized] || titleCase(normalized);
};

const normalizeFieldKey = (key) => key
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const START_RECORD_KEYS = new Set([
  'disease_id',
  'disease_name',
  'pest_id',
  'pest_name',
  'weed_id',
  'weed_name',
  'common_name',
]);

const SUMMARY_PRIORITY_KEYS = [
  'symptoms',
  'damage_symptoms',
  'favorable_conditions',
  'affected_parts',
  'management_cultural',
  'management_chemical',
  'management_biological',
  'prevention',
  'resistance_varieties',
  'biological_name',
  'pathogen_type',
  'disease_class',
];

const TITLE_KEYS = ['common_name', 'disease_name', 'pest_name', 'weed_name'];

const FIELD_ORDER = [
  'plant_crop_group',
  'plant_host',
  ...TITLE_KEYS,
  ...SUMMARY_PRIORITY_KEYS,
];

const appendFieldValue = (record, key, value) => {
  if (!value) {
    return;
  }

  if (!record[key]) {
    record[key] = [];
  }

  if (!record[key].includes(value)) {
    record[key].push(value);
  }
};

const createChunkRecord = (sharedFields = {}) => ({
  fields: Object.entries(sharedFields).reduce((accumulator, [key, values]) => {
    accumulator[key] = [...values];
    return accumulator;
  }, {}),
});

const parseChunkRecords = (chunkContent) => {
  const lines = String(chunkContent || '')
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sharedFields = {};
  const records = [];
  let currentRecord = createChunkRecord(sharedFields);
  let seenRecordSpecificField = false;

  const pushCurrentRecord = () => {
    const hasMeaningfulField = Object.keys(currentRecord.fields)
      .some((key) => !['plant_crop_group'].includes(key));

    if (hasMeaningfulField) {
      records.push(currentRecord);
    }
  };

  for (const line of lines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex < 0) {
      appendFieldValue(currentRecord.fields, 'notes', line);
      seenRecordSpecificField = true;
      continue;
    }

    const rawKey = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!value) {
      continue;
    }

    const key = normalizeFieldKey(rawKey);
    const isSharedField = key === 'plant_crop_group';
    const startsNewRecord = START_RECORD_KEYS.has(key)
      && seenRecordSpecificField
      && TITLE_KEYS.includes(key);

    if (startsNewRecord) {
      pushCurrentRecord();
      currentRecord = createChunkRecord(sharedFields);
      seenRecordSpecificField = false;
    }

    if (isSharedField) {
      appendFieldValue(sharedFields, key, value);
      appendFieldValue(currentRecord.fields, key, value);
      continue;
    }

    appendFieldValue(currentRecord.fields, key, value);
    seenRecordSpecificField = true;
  }

  pushCurrentRecord();
  return records.length ? records : [currentRecord];
};

const joinValues = (values) => values.join('; ');

const truncateText = (value, maxLength = MAX_FIELD_VALUE_CHARS) => {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const buildRecordTitle = (fields) => {
  for (const key of TITLE_KEYS) {
    if (fields[key]?.length) {
      return fields[key][0];
    }
  }

  if (fields.plant_crop_group?.length) {
    return `${fields.plant_crop_group[0]} advisory`;
  }

  return 'Agricultural advisory';
};

const formatRecordSummary = (record, index) => {
  const { fields } = record;
  const lines = [`Record ${index + 1}: ${buildRecordTitle(fields)}`];

  if (fields.plant_crop_group?.length) {
    lines.push(`Crop group: ${truncateText(joinValues(fields.plant_crop_group))}`);
  }

  if (fields.plant_host?.length) {
    lines.push(`Host crop: ${truncateText(joinValues(fields.plant_host))}`);
  }

  for (const key of SUMMARY_PRIORITY_KEYS) {
    if (!fields[key]?.length) {
      continue;
    }

    lines.push(`${prettifyKey(key)}: ${truncateText(joinValues(fields[key]))}`);
  }

  const emittedKeys = new Set([...FIELD_ORDER, 'notes']);
  const remainingFields = Object.keys(fields)
    .filter((key) => fields[key]?.length && !emittedKeys.has(key));

  for (const key of remainingFields) {
    lines.push(`${prettifyKey(key)}: ${truncateText(joinValues(fields[key]))}`);
  }

  if (fields.notes?.length) {
    lines.push(`Notes: ${truncateText(joinValues(fields.notes))}`);
  }

  return lines.join('\n');
};

const formatChunkForPrompt = (chunkContent) => parseChunkRecords(chunkContent)
  .map((record, index) => formatRecordSummary(record, index))
  .join('\n\n');

const summarizeChunkForLog = (chunk) => {
  const records = parseChunkRecords(chunk.content);
  const firstRecord = records[0]?.fields || {};
  const title = buildRecordTitle(firstRecord);
  const preview = String(chunk.content || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_LOG_PREVIEW_CHARS);

  return {
    id: chunk.id,
    title,
    score: Number(chunk.score || 0).toFixed(2),
    preview,
    recordCount: records.length,
  };
};

const SIMPLE_GREETING_PATTERN = /^(hi|hello|hey|greetings|namaste|good\s+(morning|afternoon|evening|day))(\s+there|\s+all)?([!.?]*)$/i;
const SIMPLE_CAPABILITY_PATTERN = /^(what\s+can\s+you\s+do|who\s+are\s+you|help|can\s+you\s+help(\s+me)?|how\s+can\s+you\s+help|test|testing)([!.?]*)$/i;

const isSimpleGeneralQuery = (question) => {
  const normalized = String(question || '').trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return false;
  }

  if (SIMPLE_GREETING_PATTERN.test(normalized) || SIMPLE_CAPABILITY_PATTERN.test(normalized)) {
    return true;
  }

  return normalized.split(' ').length <= MAX_SIMPLE_QUERY_WORDS
    && /^(hi|hello|hey|namaste|thanks|thank you|ok|okay)[!.?]*$/i.test(normalized);
};

const buildCompactNoContextPrompt = (question) => [
  '### INSTRUCTION',
  'You are a friendly agricultural assistant.',
  'The user is greeting you or asking a general question.',
  'Reply naturally, politely, and briefly (1 sentence).',
  '',
  `### USER: ${question}`,
  '### RESPONSE:',
].join('\n');

const buildBasePrompt = (question, context = null) => {
  // If we have no context and it's a simple query, use the compact prompt.
  if (!context && isSimpleGeneralQuery(question)) {
    return buildCompactNoContextPrompt(question);
  }

  const promptLines = [
    '### ROLE',
    'You are an expert agricultural advisor helping farmers.',
    '',
    '### GUIDELINES',
    '1. If [RETRIEVED CONTEXT] is provided and relevant, use it to answer the user.',
    '2. If [RETRIEVED CONTEXT] is not relevant or missing, answer based on your general agricultural knowledge.',
    '3. For crop diseases/pests, provide: Identification, Symptoms, and Control (Organic & Chemical).',
    '4. Be practical, safe, and concise (max 4-5 sentences).',
    '5. Do not mention "context chunks" or "database" in your response.',
  ];

  if (context) {
    promptLines.push('');
    promptLines.push('### RETRIEVED CONTEXT');
    promptLines.push(context);
    promptLines.push('### END OF CONTEXT');
  } else {
    promptLines.push('');
    promptLines.push('### NOTE');
    promptLines.push('No local database records matched this query. Use your general agricultural knowledge to answer.');
  }

  promptLines.push('');
  promptLines.push(`### USER QUESTION: ${question}`);
  promptLines.push('### ADVISORY RESPONSE:');

  return promptLines.join('\n');
};

const parseRagBundle = (bundleJson) => {
  const chunks = Array.isArray(bundleJson?.chunks) ? bundleJson.chunks : [];
  const embeddingDim = Number(bundleJson?.embedding_dim || 0);
  const matrixBase64 = bundleJson?.matrix;

  if (!matrixBase64 || !embeddingDim || chunks.length === 0) {
    throw new Error('Offline RAG bundle is incomplete');
  }

  const matrixBuffer = Buffer.from(matrixBase64, 'base64');
  const matrixBytes = matrixBuffer.buffer.slice(matrixBuffer.byteOffset, matrixBuffer.byteOffset + matrixBuffer.byteLength);
  const matrix = new Float32Array(matrixBytes);
  const rowCount = Math.floor(matrix.length / embeddingDim);

  return {
    version: bundleJson.version,
    embeddingModel: bundleJson.embedding_model,
    embeddingDim,
    rowCount,
    matrix,
    chunks: chunks.slice(0, rowCount),
  };
};

const loadCachedRagBundle = async () => {
  if (ragBundleCache) {
    console.log(`Offline RAG using in-memory bundle cache (${ragBundleCache.chunks.length} chunks)`);
    return ragBundleCache;
  }

  if (!ragBundlePromise) {
    ragBundlePromise = (async () => {
      const bundleInfo = await readBundleFileInfo();
      if (!bundleInfo.exists) {
        console.log('Offline RAG bundle not found in device storage');
        return null;
      }

      console.log(`Offline RAG loading cached bundle from ${bundleInfo.path} (${bundleInfo.sizeLabel})`);
      try {
        const jsonText = await RNFS.readFile(RAG_BUNDLE_PATH, 'utf8');
        ragBundleCache = parseRagBundle(JSON.parse(jsonText));
      } catch (error) {
        console.warn('Offline RAG cached bundle is invalid, deleting it:', error?.message || error);
        await RNFS.unlink(RAG_BUNDLE_PATH).catch(() => {});
        return null;
      }
      console.log(`Offline RAG cached bundle loaded successfully (${ragBundleCache.chunks.length} chunks)`);
      return ragBundleCache;
    })().finally(() => {
      ragBundlePromise = null;
    });
  }

  return ragBundlePromise;
};

const refreshRagBundle = async () => {
  if (!ragBundlePromise) {
    ragBundlePromise = (async () => {
      const bundleUrl = await getOfflineRagBundleUrl();
      console.log(`Offline RAG requesting bundle from ${bundleUrl}`);
      const response = await fetch(bundleUrl);
      const bundleJson = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Offline RAG bundle request failed:', bundleJson?.detail || response.status);
        throw new Error(bundleJson?.detail || 'Failed to download offline RAG bundle');
      }

      await ensureDirectory();
      console.log(`Offline RAG writing bundle to ${RAG_BUNDLE_PATH}`);
      await RNFS.writeFile(RAG_BUNDLE_PATH, JSON.stringify(bundleJson), 'utf8');
      ragBundleCache = parseRagBundle(bundleJson);
      const bundleInfo = await readBundleFileInfo();
      console.log(`Offline RAG bundle cached successfully (${bundleInfo.sizeLabel}, ${ragBundleCache.chunks.length} chunks)`);
      return ragBundleCache;
    })().finally(() => {
      ragBundlePromise = null;
    });
  }

  return ragBundlePromise;
};

export const OfflineRagService = {
  getCachedBundleInfo: async () => readBundleFileInfo(),

  isRetrievalAvailable: async () => {
    const bundleInfo = await readBundleFileInfo();
    return bundleInfo.exists;
  },

  prepareResources: async ({ allowNetworkSync = false } = {}) => {
    const tasks = [allowNetworkSync ? refreshRagBundle() : loadCachedRagBundle()];

    if (ENABLE_NATIVE_QUERY_EMBEDDING) {
      tasks.push(ensureTokenizer());

      if (hasOnnxRuntimeBinding()) {
        tasks.push(ensureEmbeddingSession());
      } else {
        warnUnavailableRuntime();
      }
    } else {
      warnDisabledEmbedding();
    }

    await Promise.all(tasks);
  },

  hasCachedBundle: async () => RNFS.exists(RAG_BUNDLE_PATH),

  prefetchBundle: async () => {
    console.log('Offline RAG prefetch started');
    await OfflineRagService.prepareResources({ allowNetworkSync: true });
    const bundleInfo = await readBundleFileInfo();
    console.log(`Offline RAG prefetch finished. Cached=${bundleInfo.exists} Size=${bundleInfo.sizeLabel}`);
    return bundleInfo;
  },

  retrieveRelevantChunks: async (query, { topK = DEFAULT_TOP_K, allowNetworkSync = false } = {}) => {
    console.log('Offline RAG retrieval started');
    let ragBundle = await loadCachedRagBundle();
    if (!ragBundle && allowNetworkSync) {
      ragBundle = await refreshRagBundle();
    }

    if (!ragBundle) {
      console.log('Offline RAG skipped because no cached bundle is available');
      return [];
    }

    const similarities = [];
    const limit = Math.min(ragBundle.chunks.length, ragBundle.rowCount);
    const retrievalMode = ENABLE_NATIVE_QUERY_EMBEDDING ? 'semantic' : 'lexical';
    console.log(`Offline RAG retrieval mode=${retrievalMode} query="${query}" chunkCount=${limit}`);

    if (ENABLE_NATIVE_QUERY_EMBEDDING) {
      const queryVector = await embedQuery(query);
      if (!queryVector) {
        console.log('Offline RAG embedding unavailable, returning no retrieved chunks');
        return [];
      }

      for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
        const chunk = ragBundle.chunks[rowIndex];
        if (!chunk?.content) {
          continue;
        }

        const offset = rowIndex * ragBundle.embeddingDim;
        let score = 0;
        for (let dimIndex = 0; dimIndex < ragBundle.embeddingDim; dimIndex += 1) {
          score += queryVector[dimIndex] * ragBundle.matrix[offset + dimIndex];
        }

        // Apply a high threshold for strict relevance
        if (score >= 0.45) {
          similarities.push({
            id: chunk.id,
            content: chunk.content,
            score,
          });
        }
      }
    } else {
      const queryProfile = buildQueryProfile(query);
      for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
        const chunk = ragBundle.chunks[rowIndex];
        if (!chunk?.content) {
          continue;
        }

        const score = scoreChunkLexically(queryProfile, chunk.content);
        if (score < MIN_LEXICAL_SCORE) {
          continue;
        }

        similarities.push({
          id: chunk.id,
          content: chunk.content,
          score,
        });
      }
    }

    similarities.sort((left, right) => right.score - left.score);
    // Dynamic top-K: Only select chunks that are close to the top match
    const topMatchScore = similarities[0]?.score || 0;
    const selected = similarities.filter(s => s.score >= topMatchScore * 0.85).slice(0, topK);
    
    console.log(`Offline RAG retrieval complete with ${selected.length} chunks (threshold=0.45, top=${topMatchScore.toFixed(2)})`);
    selected.forEach((chunk, index) => {
      const summary = summarizeChunkForLog(chunk);
      console.log(`Offline RAG chunk ${index + 1}: id=${summary.id} score=${summary.score} title="${summary.title}" records=${summary.recordCount} preview="${summary.preview}"`);
    });
    return selected;
  },

  buildAugmentedPrompt: async (question, { allowNetworkSync = false, topK = DEFAULT_TOP_K } = {}) => {
    console.log('Offline RAG prompt build started');

    // Optimization: Skip RAG entirely for simple greetings or general queries
    // This implements the "Think before using RAG" strategy to save resources and reduce hallucination risk
    if (isSimpleGeneralQuery(question)) {
      console.log('Offline RAG skipped for simple/general query');
      return buildBasePrompt(question);
    }

    const chunks = await OfflineRagService.retrieveRelevantChunks(question, { allowNetworkSync, topK });
    if (!chunks.length) {
      console.log('Offline RAG prompt build returned a no-context instruction prompt');
      return buildBasePrompt(question);
    }

    let remainingChars = MAX_CONTEXT_CHARS;
    const selectedChunks = [];
    for (const chunk of chunks) {
      if (remainingChars <= 0) {
        break;
      }

      const formatted = formatChunkForPrompt(chunk.content);
      const trimmed = formatted.slice(0, remainingChars);
      selectedChunks.push(trimmed);
      remainingChars -= trimmed.length;
      console.log(`Offline RAG formatted chunk ${selectedChunks.length}: originalChars=${chunk.content.length} formattedChars=${formatted.length} trimmedChars=${trimmed.length}`);
    }

    const context = selectedChunks
      .map((content, index) => `[Context ${index + 1}]\n${content}`)
      .join('\n\n');

    console.log(`Offline RAG prompt context assembled with ${selectedChunks.length} chunks and ${context.length} context chars`);

    return buildBasePrompt(question, context);
  },

  benchmarkRetrieval: async (queries = ['Rice blast symptoms', 'How to treat tomato blight', 'Wheat rust prevention', 'Cotton pest control', 'Maize fertilizer schedule']) => {
    console.log('--- Starting Offline RAG Retrieval Benchmark ---');
    const results = [];
    let totalTime = 0;

    // Warm up first
    await OfflineRagService.retrieveRelevantChunks('warmup query', { topK: 1 });

    for (const query of queries) {
      const start = Date.now();
      const chunks = await OfflineRagService.retrieveRelevantChunks(query, { topK: 3 });
      const duration = Date.now() - start;
      
      console.log(`Query: "${query}" -> Found ${chunks.length} chunks in ${duration}ms`);
      results.push({ query, duration, chunkCount: chunks.length });
      totalTime += duration;
    }

    const averageTime = (totalTime / queries.length).toFixed(2);
    const report = {
      averageTimeMs: averageTime,
      totalQueries: queries.length,
      details: results
    };
    
    console.log(`--- Benchmark Complete: Avg ${averageTime}ms per query ---`);
    return report;
  },
};

export default OfflineRagService;