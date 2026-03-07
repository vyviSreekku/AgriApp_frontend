import RNFS from 'react-native-fs';
import { NativeModules, DeviceEventEmitter } from 'react-native';

// Destructure the native module
const { LLMModule } = NativeModules;

// Configuration
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf';
const MODEL_FILE_NAME = decodeURIComponent(MODEL_URL.split('/').pop() || 'model.gguf');
const DESTINATION_PATH = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE_NAME}`;

const DEFAULT_CONTEXT_SIZE = 512;
const DEFAULT_NUM_THREADS = 8;

export const ModelManager = {
  hasModel: async () => RNFS.exists(DESTINATION_PATH),

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

      // Load into C++ Memory via Native Module
      const modelConfig = {
        modelPath: DESTINATION_PATH,
        minP: 0.05,
        temperature: 0.6,
        storeChats: true,
        contextSize: DEFAULT_CONTEXT_SIZE,
        // Qwen2.5 chat template structure
        chatTemplate: "{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}",
        nThreads: DEFAULT_NUM_THREADS,
        useMmap: true,
        useMlock: false,
      };

      console.log("Loading model into memory...");
      await LLMModule.loadModel(modelConfig);
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
      try {
        if (!LLMModule) {
          reject(new Error("LLMModule native module is not available"));
          return;
        }

        let response = '';

        // Clean up any existing listeners to prevent duplicates
        DeviceEventEmitter.removeAllListeners('onToken');

        // Listen for tokens from native side
        const subscription = DeviceEventEmitter.addListener('onToken', (token) => {
          // Check for End of Generation token (defined in C++ bridge)
          if (token === "[EOG]") {
             // console.log("JS ModelManager received EOG");
             subscription.remove();
             resolve(response);
          } else if (token) {
             // console.log("JS ModelManager received token:", token);
             response += token;
             if (onTokenCallback) {
                onTokenCallback(token);
             }
          }
        });
        
        console.log("Invoking native generateResponse...");
        // Call native generate. The second argument is a callback, but we rely on events for streaming.
        LLMModule.generateResponse(prompt, () => {
           // This callback might be used for final completion signal in some implementations,
           // but our bridge uses events for streaming.
        });
        
      } catch (err) {
        console.error("Generation error:", err);
        // Ensure listener is removed on error
        DeviceEventEmitter.removeAllListeners('onToken');
        reject(err);
      }
    });
  }
};

export default ModelManager;
