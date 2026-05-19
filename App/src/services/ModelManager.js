import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import { NativeModules, DeviceEventEmitter } from 'react-native';

// Destructure the native module
const { LLMModule } = NativeModules;

// Configuration
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf';
const MODEL_FILE_NAME = decodeURIComponent(MODEL_URL.split('/').pop() || 'model.gguf');
const DESTINATION_PATH = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE_NAME}`;

const FLASH_ATTENTION_AUTO = -1;
const MAX_PROMPT_LOG_CHARS = 180;

export const MODEL_PERFORMANCE_PRESETS = {
  balanced: {
    contextSize: 4096,
    nThreads: 4,
    nThreadsBatch: 4,
    batchSize: 1024,
    microBatchSize: 128,
    maxOutputTokens: 512,
    flashAttentionType: FLASH_ATTENTION_AUTO,
    offloadKqv: false,
  },
  fast: {
    contextSize: 2048,
    nThreads: 4,
    nThreadsBatch: 4,
    batchSize: 512,
    microBatchSize: 128,
    maxOutputTokens: 256,
    flashAttentionType: FLASH_ATTENTION_AUTO,
    offloadKqv: true,
  },
  maxSpeed: {
    contextSize: 2048,
    nThreads: 4,
    nThreadsBatch: 4,
    batchSize: 512,
    microBatchSize: 128,
    maxOutputTokens: 256,
    flashAttentionType: FLASH_ATTENTION_AUTO,
    offloadKqv: true,
  },
  releaseSafe: {
    contextSize: 4096,
    nThreads: 4,
    nThreadsBatch: 4,
    batchSize: 1024,
    microBatchSize: 128,
    maxOutputTokens: 512,
    flashAttentionType: FLASH_ATTENTION_AUTO,
    offloadKqv: true,
  },
};

const ACTIVE_MODEL_PERFORMANCE_PRESET = __DEV__ ? 'maxSpeed' : 'releaseSafe';

const getActivePerformancePreset = () => {
  const preset = MODEL_PERFORMANCE_PRESETS[ACTIVE_MODEL_PERFORMANCE_PRESET];

  if (preset) {
    return {
      name: ACTIVE_MODEL_PERFORMANCE_PRESET,
      config: preset,
    };
  }

  console.warn(`Unknown model performance preset "${ACTIVE_MODEL_PERFORMANCE_PRESET}". Falling back to balanced.`);
  return {
    name: 'balanced',
    config: MODEL_PERFORMANCE_PRESETS.balanced,
  };
};

const truncateForLog = (value, maxLength = MAX_PROMPT_LOG_CHARS) => {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).replace(/\s+/g, ' ').trimEnd()}...`;
};

const MIN_VALID_MODEL_BYTES = 100 * 1024 * 1024;

const hasInternetAccess = async () => {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch (error) {
    console.warn('Failed to check network state before model download:', error);
    return false;
  }
};

const getModelFileInfo = async () => {
  const exists = await RNFS.exists(DESTINATION_PATH);
  if (!exists) {
    return { exists: false, size: 0 };
  }

  const stat = await RNFS.stat(DESTINATION_PATH);
  return {
    exists: true,
    size: Number(stat.size || 0),
  };
};

const isLikelyValidModel = async () => {
  try {
    const info = await getModelFileInfo();
    if (!info.exists) return false;
    if (info.size < MIN_VALID_MODEL_BYTES) return false;
    // Prefer explicit file extension check for common GGUF models
    if (MODEL_FILE_NAME && MODEL_FILE_NAME.toLowerCase().includes('.gguf')) return true;
    // Fall back to size-based confidence
    return info.size >= MIN_VALID_MODEL_BYTES;
  } catch (err) {
    console.warn('Failed to probe model file validity:', err);
    return false;
  }
};

export const ModelManager = {
  hasModel: async () => RNFS.exists(DESTINATION_PATH),

  isModelReady: async () => {
    if (!LLMModule?.isModelReady) {
      return false;
    }

    try {
      return await LLMModule.isModelReady();
    } catch (error) {
      console.error('Failed to query native model readiness:', error);
      return false;
    }
  },

  resetConversation: async () => {
    if (!LLMModule?.resetConversation) {
      return;
    }

    await LLMModule.resetConversation();
  },

  /**
   * Downloads (if necessary) and loads the model into memory.
   * @param {function} onProgress - Callback for download progress (0.0 to 1.0).
   * @returns {Promise<boolean>} - True if successful, false otherwise.
   */
  setupModel: async (onProgress) => {
    try {
      if (!LLMModule) {
        console.error("LLMModule not found in NativeModules. Ensure the app is built with the native module.");
        return false;
      }

      const modelFileInfo = await getModelFileInfo();

      if (!modelFileInfo.exists) {
        const online = await hasInternetAccess();
        if (!online) {
          console.warn('Offline model file is missing and the device is offline. Skipping download.');
          return false;
        }

        console.log("Model file not found. Starting download from:", MODEL_URL);
        
        // Download if missing
        const options = {
          fromUrl: MODEL_URL,
          toFile: DESTINATION_PATH,
          progress: (res) => {
            const totalBytes = res.contentLength || 0;
            const percent = totalBytes > 0 ? (res.bytesWritten / totalBytes) : 0;
            if(onProgress) onProgress(percent);
          },
          background: true,
          discretionary: true,
        };

        const download = RNFS.downloadFile(options);
        const result = await download.promise;

        if (result.statusCode !== 200) {
          console.error("Download failed with status code:", result.statusCode);
          // Clean up partial file
          await RNFS.unlink(DESTINATION_PATH).catch(() => {});
          return false;
        }
        console.log("Model download completed successfully.");
      } else if (modelFileInfo.size < MIN_VALID_MODEL_BYTES) {
        console.warn(`Offline model file looks incomplete (${modelFileInfo.size} bytes). Removing it before load.`);
        await RNFS.unlink(DESTINATION_PATH).catch(() => {});

        const online = await hasInternetAccess();
        if (!online) {
          console.warn('Offline model file is incomplete and the device is offline. Skipping load.');
          return false;
        }

        console.log('Retrying model download after removing incomplete cache.');
        const download = RNFS.downloadFile({
          fromUrl: MODEL_URL,
          toFile: DESTINATION_PATH,
          progress: (res) => {
            const totalBytes = res.contentLength || 0;
            const percent = totalBytes > 0 ? (res.bytesWritten / totalBytes) : 0;
            if (onProgress) onProgress(percent);
          },
          background: true,
          discretionary: true,
        });
        const result = await download.promise;

        if (result.statusCode !== 200) {
          console.error('Redownload failed with status code:', result.statusCode);
          await RNFS.unlink(DESTINATION_PATH).catch(() => {});
          return false;
        }
        console.log('Model redownload completed successfully.');
      } else {
        console.log("Model file already exists at:", DESTINATION_PATH);
        if(onProgress) onProgress(1.0); // Notify completion immediately
      }

      const activePreset = getActivePerformancePreset();

      // If we're offline at this point, only attempt native load when the
      // existing file looks like a valid model. If it doesn't, skip loading.
      const onlineNow = await hasInternetAccess();
      if (!onlineNow) {
        const valid = await isLikelyValidModel();
        if (!valid) {
          console.warn('Device is offline and model is missing or not a valid cache. Skipping native load.');
          return false;
        }
      }

      // Load into C++ Memory via Native Module
      const modelConfig = {
        modelPath: DESTINATION_PATH,
        minP: 0.05,
        temperature: 0.6,
        storeChats: __DEV__,
        contextSize: activePreset.config.contextSize,
        // Qwen2.5 chat template structure
        chatTemplate: "{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}",
        nThreads: activePreset.config.nThreads,
        nThreadsBatch: activePreset.config.nThreadsBatch,
        batchSize: activePreset.config.batchSize,
        microBatchSize: activePreset.config.microBatchSize,
        maxOutputTokens: activePreset.config.maxOutputTokens,
        flashAttentionType: activePreset.config.flashAttentionType,
        offloadKqv: activePreset.config.offloadKqv,
        // mmap has been unstable for this model on some devices; keep the
        // compute settings unchanged and load the file via standard reads.
        useMmap: false,
        useMlock: false,
      };

      console.log("Loading model into memory...");
      console.log(`Model performance preset: ${activePreset.name}`);
      console.log(`Model config: ctx=${modelConfig.contextSize} threads=${modelConfig.nThreads} batchThreads=${modelConfig.nThreadsBatch} batch=${modelConfig.batchSize} ubatch=${modelConfig.microBatchSize} maxOutputTokens=${modelConfig.maxOutputTokens} flashAttn=${modelConfig.flashAttentionType} mmap=${modelConfig.useMmap}`);
      try {
        await LLMModule.loadModel(modelConfig);
      } catch (nativeErr) {
        console.error('Native loadModel failed or rejected:', nativeErr);
        // When offline, don't attempt redownload here; just surface failure.
        return false;
      }
      const ready = await ModelManager.isModelReady();
      if (!ready) {
        console.error('Native model reported not ready after loadModel');
        return false;
      }
      console.log("Model loaded successfully.");
      return true;

    } catch (error) {
      console.error("Model setup failed:", error);
      return false;
    }
  },

  /**
   * Benchmarks the loaded model.
   * @param {object} config - Benchmark configuration.
   * @param {number} config.pp - Prompt processing token count (default: 8).
   * @param {number} config.tg - Text generation token count (default: 16).
   * @param {number} config.pl - Prompt length (default: 1).
   * @param {number} config.nr - Number of runs (default: 1).
   * @returns {Promise<string>} - Benchmark report string.
   */
  benchmark: async ({ pp = 8, tg = 16, pl = 1, nr = 1 } = {}) => {
    if (!LLMModule?.bench) {
      throw new Error("LLMModule.bench is not available.");
    }
    const ready = await ModelManager.isModelReady();
    if (!ready) {
      throw new Error("Model not ready for benchmarking.");
    }
    return LLMModule.bench({ pp, tg, pl, nr });
  },

  /**
   * Generates text response for a given prompt.
   * Uses event listeners to stream tokens back to JS.
   * @param {string} prompt - Input text or chat history formatted string.

   * @param {function} onTokenCallback - Callback for each token received.
   * @returns {Promise<string>} - The full response string.
   */
  generate: (prompt, onTokenCallback) => {
    return new Promise((resolve, reject) => {
      let subscription;
      const startedAt = Date.now();
      let streamChunkCount = 0;
      let emittedCharCount = 0;

      (async () => {
      try {
        if (!LLMModule) {
          reject(new Error("LLMModule native module is not available"));
          return;
        }

        const ready = await ModelManager.isModelReady();
        if (!ready) {
          reject(new Error('Offline model is not initialized'));
          return;
        }

        let response = '';

        // Clean up any existing listeners to prevent duplicates
        DeviceEventEmitter.removeAllListeners('onToken');

        // Listen for tokens from native side
        subscription = DeviceEventEmitter.addListener('onToken', (token) => {
          // Check for End of Generation token (defined in C++ bridge)
          if (token === "[EOG]") {
             const elapsedMs = Date.now() - startedAt;
             const seconds = Math.max(elapsedMs / 1000, 0.001);
             const charsPerSecond = (response.length / seconds).toFixed(1);
             console.log(`Offline generation finished in ${elapsedMs} ms (outputChars=${response.length}, streamedChunks=${streamChunkCount}, charsPerSecond=${charsPerSecond})`);
             subscription.remove();
             resolve(response);
          } else if (token) {
             streamChunkCount += 1;
             emittedCharCount += token.length;
             response += token;
             if (onTokenCallback) {
                onTokenCallback(token);
             }
          }
        });
        
          console.log(`Starting generation with promptChars=${prompt.length} preview="${truncateForLog(prompt)}"`);
        console.log("Invoking native generateResponse...");
        // Call native generate. The second argument is a callback, but we rely on events for streaming.
        LLMModule.generateResponse(prompt, () => {
           // This callback might be used for final completion signal in some implementations,
           // but our bridge uses events for streaming.
        });
        
      } catch (err) {
          console.error(`Generation error after outputChars=${emittedCharCount} streamChunks=${streamChunkCount}:`, err);
        // Ensure listener is removed on error
        subscription?.remove();
        DeviceEventEmitter.removeAllListeners('onToken');
        reject(err);
      }
      })();
    });
  }
};

export default ModelManager;

/**
 * Register a handler for native-side model errors (emitted as `onError`).
 * Returns an unsubscribe function.
 */
export const onLLMError = (handler) => {
  if (typeof handler !== 'function') return () => {};
  const sub = DeviceEventEmitter.addListener('onError', handler);
  return () => {
    try { sub.remove(); } catch (e) { DeviceEventEmitter.removeAllListeners('onError'); }
  };
};
