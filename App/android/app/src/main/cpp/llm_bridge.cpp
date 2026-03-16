#include <jni.h>
#include <android/log.h>
#include <cstring>
#include <mutex>
#include <string>
#include "LLMInference.h"

#define TAG "[SmolLMAndroid-Cpp]"
#define LOGi(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGe(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

// Global LLM instance
static LLMInference *llm = nullptr;
static constexpr int TOKEN_BATCH_SIZE = 12;

// Mutex for thread safety
static std::mutex llm_mutex;

extern "C"
JNIEXPORT void JNICALL
Java_com_smolchatrn_LLMModule_nativeInit(
        JNIEnv *env,
        jobject /* this */,
        jstring model_path,
        jfloat min_p,
        jfloat temp,
        jboolean store_chats,
        jlong context_size,
        jstring chat_template,
        jint n_threads,
    jint n_threads_batch,
    jint batch_size,
    jint micro_batch_size,
    jint max_output_tokens,
    jint flash_attention_type,
    jboolean offload_kqv,
        jboolean use_mmap,
        jboolean use_mlock
) {
    std::lock_guard<std::mutex> lock(llm_mutex);

    if (llm) {
        delete llm;
        llm = nullptr;
    }

    llm = new LLMInference();

    const char *c_model_path = env->GetStringUTFChars(model_path, nullptr);
        const char *c_chat_template_path = chat_template == nullptr
            ? nullptr
            : env->GetStringUTFChars(chat_template, nullptr);

    try {
        llm->loadModel(
                c_model_path,
                min_p,
                temp,
                store_chats,
                context_size,
                c_chat_template_path,
                n_threads,
                n_threads_batch,
                batch_size,
                micro_batch_size,
                max_output_tokens,
                flash_attention_type,
                offload_kqv,
                use_mmap,
                use_mlock
        );
        LOGi("Model loaded successfully");
    } catch (const std::exception &e) {
        LOGe("Error loading model: %s", e.what());
        delete llm;
        llm = nullptr;
    }

    env->ReleaseStringUTFChars(model_path, c_model_path);
    if (chat_template != nullptr && c_chat_template_path != nullptr) {
        env->ReleaseStringUTFChars(chat_template, c_chat_template_path);
    }
}

extern "C"
JNIEXPORT void JNICALL
Java_com_smolchatrn_LLMModule_nativeGenerate(
        JNIEnv *env,
        jobject /* this */,
        jstring user_prompt,
        jobject on_token_callback
) {
    std::lock_guard<std::mutex> lock(llm_mutex);

    if (!llm) {
        LOGe("LLM not initialized. Call nativeInit() first.");
        return;
    }

    const char *c_user_prompt = env->GetStringUTFChars(user_prompt, nullptr);
    LOGi("nativeGenerate called with prompt: %s", c_user_prompt);

    // Get callback class
    jclass callback_class = env->GetObjectClass(on_token_callback);
    if (!callback_class) {
        LOGe("Failed to get callback class");
        env->ReleaseStringUTFChars(user_prompt, c_user_prompt);
        return;
    }

    // Method: void invoke(String token)
    jmethodID invoke_method =
            env->GetMethodID(callback_class, "invoke", "(Ljava/lang/String;)V");

    if (!invoke_method) {
        LOGe("Callback method invoke(String) not found");
        env->DeleteLocalRef(callback_class);
        env->ReleaseStringUTFChars(user_prompt, c_user_prompt);
        return;
    }

    // Global ref for long-running inference
    jobject global_callback = env->NewGlobalRef(on_token_callback);

    try {
        llm->startCompletion(c_user_prompt);

        LOGi("Entering generation loop");
        std::string token_buffer;
        int buffered_token_count = 0;

        auto flush_tokens = [&](const std::string &chunk) {
            if (chunk.empty()) {
                return;
            }

            jstring j_token = env->NewStringUTF(chunk.c_str());
            env->CallVoidMethod(global_callback, invoke_method, j_token);
            env->DeleteLocalRef(j_token);
        };

        while (true) {
            std::string token = llm->completionLoop();

            if (token == "[EOG]") {
                flush_tokens(token_buffer);
                token_buffer.clear();
                buffered_token_count = 0;
                llm->stopCompletion();
                // Send EOG token to notify JS that generation is done
                jstring j_eog = env->NewStringUTF("[EOG]");
                LOGi("Sending EOG token");
                env->CallVoidMethod(global_callback, invoke_method, j_eog);
                env->DeleteLocalRef(j_eog);
                break;
            }

            if (token.empty()) {
                continue;
            }

            token_buffer += token;
            buffered_token_count += 1;

            if (buffered_token_count >= TOKEN_BATCH_SIZE || token_buffer.size() >= 96) {
                LOGi("Emitting token chunk: %s", token_buffer.c_str());
                flush_tokens(token_buffer);
                token_buffer.clear();
                buffered_token_count = 0;
            }
        }
    } catch (const std::exception &e) {
        LOGe("Error during text generation: %s", e.what());
    }

    env->DeleteGlobalRef(global_callback);
    env->DeleteLocalRef(callback_class);
    env->ReleaseStringUTFChars(user_prompt, c_user_prompt);
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_smolchatrn_LLMModule_nativeBench(
        JNIEnv *env,
        jobject /* this */,
        jint pp,
        jint tg,
        jint pl,
        jint nr
) {
    std::lock_guard<std::mutex> lock(llm_mutex);

    if (!llm) {
        LOGe("LLM not initialized");
        return env->NewStringUTF("LLM not initialized");
    }

    try {
        std::string report = llm->benchModel(pp, tg, pl, nr);
        return env->NewStringUTF(report.c_str());
    } catch (const std::exception &e) {
        LOGe("Benchmark error: %s", e.what());
        return env->NewStringUTF("Benchmark failed");
    }
}

extern "C"
JNIEXPORT void JNICALL
Java_com_smolchatrn_LLMModule_nativeRelease(
        JNIEnv * /* env */,
        jobject /* this */
) {
    std::lock_guard<std::mutex> lock(llm_mutex);

    if (llm) {
        delete llm;
        llm = nullptr;
        LOGi("LLM released");
    }
}

extern "C"
JNIEXPORT void JNICALL
Java_com_smolchatrn_LLMModule_nativeResetConversation(
        JNIEnv * /* env */,
        jobject /* this */
) {
    std::lock_guard<std::mutex> lock(llm_mutex);

    if (!llm) {
        LOGi("nativeResetConversation ignored because LLM is not initialized");
        return;
    }

    llm->resetConversation();
    LOGi("Conversation reset complete");
}

extern "C"
JNIEXPORT jboolean JNICALL
Java_com_smolchatrn_LLMModule_nativeIsModelReady(
        JNIEnv * /* env */,
        jobject /* this */
) {
    std::lock_guard<std::mutex> lock(llm_mutex);
    return llm != nullptr;
}
