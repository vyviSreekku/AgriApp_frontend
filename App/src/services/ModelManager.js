import RNFS from 'react-native-fs';
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
    contextSize: 384,
    nThreads: 4,
    nThreadsBatch: 4,
    batchSize: 128,
    microBatchSize: 64,
    maxOutputTokens: 80,
    flashAttentionType: FLASH_ATTENTION_AUTO,
    offloadKqv: false,
  },
  fast: {
    contextSize: 320,
    nThreads: 4,
    nThreadsBatch: 4,
    batchSize: 96,
    microBatchSize: 48,
    maxOutputTokens: 64,
    flashAttentionType: FLASH_ATTENTION_AUTO,
    offloadKqv: false,
  },
  maxSpeed: {
    contextSize: 256,
    nThreads: 3,
    nThreadsBatch: 3,
    batchSize: 64,
    microBatchSize: 32,
    maxOutputTokens: 48,
    flashAttentionType: FLASH_ATTENTION_AUTO,
    offloadKqv: false,
  },
  releaseSafe: {
    contextSize: 384,
    nThreads: 2,
    nThreadsBatch: 2,
    batchSize: 64,
    microBatchSize: 32,
    maxOutputTokens: 256,
    flashAttentionType: FLASH_ATTENTION_AUTO,
    offloadKqv: false,
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

      const fileExists = await RNFS.exists(DESTINATION_PATH);

      if (!fileExists) {
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
      } else {
        console.log("Model file already exists at:", DESTINATION_PATH);
        if(onProgress) onProgress(1.0); // Notify completion immediately
      }

      const activePreset = getActivePerformancePreset();

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
        useMmap: true,
        useMlock: false,
      };

      console.log("Loading model into memory...");
      console.log(`Model performance preset: ${activePreset.name}`);
      console.log(`Model config: ctx=${modelConfig.contextSize} threads=${modelConfig.nThreads} batchThreads=${modelConfig.nThreadsBatch} batch=${modelConfig.batchSize} ubatch=${modelConfig.microBatchSize} maxOutputTokens=${modelConfig.maxOutputTokens} flashAttn=${modelConfig.flashAttentionType} mmap=${modelConfig.useMmap}`);
      await LLMModule.loadModel(modelConfig);
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
