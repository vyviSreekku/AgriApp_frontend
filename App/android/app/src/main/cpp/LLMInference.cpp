#include "LLMInference.h"
#include <android/log.h>
#include <algorithm>
#include <cstring>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <cmath>
#include "common.h"

#define TAG "[SmolLMAndroid-Cpp]"
#define LOGi(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGe(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

LLMInference::LLMInference() {
    _batch       = nullptr;
    _contextSize = 0;
    _batchLimit  = 0;
}

void
LLMInference::clearChatHistory() {
    for (llama_chat_message &message : _messages) {
        free(const_cast<char *>(message.role));
        free(const_cast<char *>(message.content));
    }
    _messages.clear();
}

void
LLMInference::resetRuntimeState(bool clear_history, bool clear_kv_cache) {
    _responseGenerationTime = 0;
    _responseNumTokens = 0;
    _nCtxUsed = 0;
    _currToken = 0;
    _isPromptEvalPending = false;
    _response.clear();
    _cacheResponseTokens.clear();
    _promptTokens.clear();
    _lastPromptTokenCount = 0;
    _lastReusedPrefixTokens = 0;

    if (clear_history) {
        clearChatHistory();
        _sessionTokens.clear();
    }

    if (clear_kv_cache && _ctx) {
        llama_memory_clear(llama_get_memory(_ctx), false);
        _sessionTokens.clear();
    }

    if (_batch) {
        common_batch_clear(*_batch);
    }
}

size_t
LLMInference::countCommonPrefix(const std::vector<llama_token>& lhs, const std::vector<llama_token>& rhs) const {
    size_t common = 0;
    const size_t max_common = std::min(lhs.size(), rhs.size());
    while (common < max_common && lhs[common] == rhs[common]) {
        common += 1;
    }
    return common;
}

void
LLMInference::loadModel(const char *model_path, float minP, float temperature, bool storeChats, long contextSize,
                        const char *chatTemplate, int nThreads, int nThreadsBatch, int batchSize, int microBatchSize,
                        int maxOutputTokens, int flashAttentionType, bool offloadKqv, bool useMmap, bool useMlock) {
    LOGi("loading model with"
         "\n\tmodel_path = %s"
         "\n\tminP = %f"
         "\n\ttemperature = %f"
         "\n\tstoreChats = %d"
         "\n\tcontextSize = %li"
         "\n\tchatTemplate = %s"
         "\n\tnThreads = %d"
         "\n\tnThreadsBatch = %d"
         "\n\tbatchSize = %d"
         "\n\tmicroBatchSize = %d"
        "\n\tmaxOutputTokens = %d"
         "\n\tflashAttentionType = %d"
         "\n\toffloadKqv = %d"
         "\n\tuseMmap = %d"
         "\n\tuseMlock = %d",
        model_path, minP, temperature, storeChats, contextSize, chatTemplate, nThreads, nThreadsBatch,
        batchSize, microBatchSize, maxOutputTokens, flashAttentionType, offloadKqv, useMmap, useMlock);

    _maxOutputTokens = std::max(16, maxOutputTokens);

    llama_backend_init();

    llama_model_params model_params = llama_model_default_params();
    model_params.use_mmap = useMmap;
    model_params.use_mlock = useMlock;
    _model = llama_model_load_from_file(model_path, model_params);
    if (!_model) {
        LOGe("failed to load model from %s", model_path);
        throw std::runtime_error("loadModel() failed");
    }

    llama_context_params ctx_params = llama_context_default_params();
        const uint32_t safeContextSize    = std::max<long>(128, contextSize);
        const uint32_t safeBatchSize      = std::min<uint32_t>(static_cast<uint32_t>(std::max(32, batchSize)), safeContextSize);
        const uint32_t safeMicroBatchSize = std::min<uint32_t>(static_cast<uint32_t>(std::max(16, microBatchSize)), safeBatchSize);
    ctx_params.n_ctx        = safeContextSize;
        ctx_params.n_batch  = safeBatchSize;
        ctx_params.n_ubatch = safeMicroBatchSize;
        ctx_params.n_threads       = std::max(1, nThreads);
        ctx_params.n_threads_batch = std::max(1, nThreadsBatch);
        ctx_params.flash_attn_type = static_cast<llama_flash_attn_type>(flashAttentionType);
        ctx_params.offload_kqv = offloadKqv;
        ctx_params.no_perf = true;

           LOGi("Resolved llama context params: n_ctx=%u n_batch=%u n_ubatch=%u n_threads=%d n_threads_batch=%d flash_attn=%d offload_kqv=%d",
               safeContextSize,
               ctx_params.n_batch,
               ctx_params.n_ubatch,
               ctx_params.n_threads,
               ctx_params.n_threads_batch,
               static_cast<int>(ctx_params.flash_attn_type),
               ctx_params.offload_kqv);
    
    _ctx = llama_init_from_model(_model, ctx_params);
    if (!_ctx) {
        LOGe("llama_new_context_with_model() returned null)");
        throw std::runtime_error("llama_new_context_with_model() returned null");
    }

    // cache context and batch limits for safety checks later
    _contextSize = safeContextSize;
    _batchLimit  = safeBatchSize;

    llama_sampler_chain_params sampler_params = llama_sampler_chain_default_params();
    sampler_params.no_perf = true;
    _sampler = llama_sampler_chain_init(sampler_params);
    
    llama_sampler_chain_add(_sampler, llama_sampler_init_temp(temperature));
    llama_sampler_chain_add(_sampler, llama_sampler_init_min_p(minP, 1));
    llama_sampler_chain_add(_sampler, llama_sampler_init_dist(LLAMA_DEFAULT_SEED));

    _formattedMessages = std::vector<char>(llama_n_ctx(_ctx));
    clearChatHistory();

    if (chatTemplate == nullptr) {
        _chatTemplate = llama_model_chat_template(_model, nullptr);
        _ownsChatTemplate = false;
    } else {
        if (_ownsChatTemplate && _chatTemplate != nullptr) {
            free(const_cast<char *>(_chatTemplate));
        }
        _chatTemplate = strdup(chatTemplate);
        _ownsChatTemplate = true;
    }
    this->_storeChats = storeChats;

    // Initialize batch once here
    if (_batch) {
        llama_batch_free(*_batch);
        delete _batch;
    }
    _batch = new llama_batch(llama_batch_init(safeContextSize, 0, 1));
    LOGi("Batch initialized with capacity %u (batchLimit=%u)", safeContextSize, _batchLimit);
    resetRuntimeState(true, true);
    LOGi("Model loaded successfully");
}

void
LLMInference::addChatMessage(const char *message, const char *role) {
    _messages.push_back({strdup(role), strdup(message)});
    trimChatHistory();
}

void
LLMInference::trimChatHistory() {
    while (_messages.size() > MAX_CHAT_MESSAGES) {
        free(const_cast<char *>(_messages.front().role));
        free(const_cast<char *>(_messages.front().content));
        _messages.erase(_messages.begin());
    }
}

float
LLMInference::getResponseGenerationTime() const {
    if (_responseGenerationTime <= 0 || _responseNumTokens <= 0) {
        return 0.0f;
    }
    return (float) _responseNumTokens / (_responseGenerationTime / 1e6);
}

int
LLMInference::getContextSizeUsed() const {
    return _nCtxUsed;
}

void
LLMInference::resetConversation() {
    LOGi("Resetting conversation state");
    resetRuntimeState(true, true);
}

void
LLMInference::startCompletion(const char *query) {
    LOGi("startCompletion called with query: %s", query);

    _responseGenerationTime = 0;
    _responseNumTokens = 0;
    _nCtxUsed = 0;
    _currToken = 0;
    _isPromptEvalPending = false;
    _response.clear();
    _cacheResponseTokens.clear();
    _promptTokens.clear();

    if (_batch) {
        common_batch_clear(*_batch);
    }

    if (!_storeChats) {
        clearChatHistory();
        _sessionTokens.clear();
        llama_memory_clear(llama_get_memory(_ctx), false);
    }

    if (!_storeChats) {
        _formattedMessages.clear();
        _formattedMessages = std::vector<char>(llama_n_ctx(_ctx));
    }

    addChatMessage(query, "user");
    
    // Apply chat template
    std::vector<common_chat_msg> messages;
    for (const llama_chat_message& message : _messages) {
        common_chat_msg msg;
        msg.role    = message.role;
        msg.content = message.content;
        messages.push_back(msg);
    }
    
    LOGi("Applying chat template...");
    common_chat_templates_inputs inputs;
    inputs.use_jinja      = true;
    inputs.messages       = messages;
    auto        templates = common_chat_templates_init(_model, _chatTemplate);
    std::string prompt    = common_chat_templates_apply(templates.get(), inputs).prompt;
    LOGi("Prompt generated: %s", prompt.c_str());

    _promptTokens = common_tokenize(llama_model_get_vocab(_model), prompt, true, true);
    LOGi("Prompt tokenized. Count: %zu", _promptTokens.size());

    if (_promptTokens.empty()) {
        LOGe("Error: No tokens generated from prompt");
        throw std::runtime_error("No tokens generated from prompt");
    }

    const size_t context_size = llama_n_ctx(_ctx);
    const size_t generation_headroom = std::max<size_t>(16, std::min<size_t>(64, static_cast<size_t>(_maxOutputTokens)));
    const size_t max_prompt_tokens = context_size > generation_headroom
        ? (context_size - generation_headroom)
        : (context_size > 1 ? context_size - 1 : 1);

    if (_promptTokens.size() > max_prompt_tokens) {
        const size_t dropped_tokens = _promptTokens.size() - max_prompt_tokens;
        LOGi("Prompt exceeds context budget. Dropping %zu oldest tokens (prompt=%zu, max_prompt=%zu, n_ctx=%zu)",
             dropped_tokens,
             _promptTokens.size(),
             max_prompt_tokens,
             context_size);
        _promptTokens.erase(_promptTokens.begin(), _promptTokens.begin() + static_cast<long>(dropped_tokens));

        // Prefix reuse is invalid after trimming prompt tokens.
        if (_storeChats) {
            llama_memory_clear(llama_get_memory(_ctx), false);
            _sessionTokens.clear();
        }
    }

    llama_memory_t memory       = llama_get_memory(_ctx);
    size_t          common_prefix = _storeChats ? countCommonPrefix(_sessionTokens, _promptTokens) : 0;

    if (_storeChats && !_sessionTokens.empty() && _sessionTokens.size() > common_prefix) {
        LOGi("Trimming KV cache suffix from %zu to %zu tokens", _sessionTokens.size(), common_prefix);
        if (!llama_memory_seq_rm(memory, 0, static_cast<llama_pos>(common_prefix), -1)) {
            LOGi("Unable to reuse cached prefix; clearing KV cache and rebuilding prompt");
            llama_memory_clear(memory, false);
            _sessionTokens.clear();
            common_prefix = 0;
        } else {
            _sessionTokens.resize(common_prefix);
        }
    }

    if (!_storeChats) {
        common_prefix = 0;
    }

    if (_sessionTokens.empty() && common_prefix == 0) {
        llama_memory_clear(memory, false);
    }

    // Ensure the prompt suffix that still needs evaluation fits within the configured batch limit.
    // llama_decode will abort the process if batch.n_tokens > ctx_params.n_batch, so we hard-cap
    // the number of tokens we will ever place in a single batch.
    const uint32_t batchLimit = _batchLimit > 0 ? _batchLimit : static_cast<uint32_t>(std::max<size_t>(32, _promptTokens.size()));

    size_t suffix_start = common_prefix;
    size_t suffix_len   = _promptTokens.size() > suffix_start ? (_promptTokens.size() - suffix_start) : 0;

    if (suffix_len > batchLimit) {
        LOGi("Prompt suffix length %zu exceeds batch limit %u; dropping oldest prompt tokens and disabling prefix reuse for this turn",
             suffix_len, batchLimit);

        // When we truncate to respect the batch limit, previously cached KV state is no
        // longer valid, so we clear it and rebuild purely from the retained tail.
        llama_memory_clear(memory, false);
        _sessionTokens.clear();
        common_prefix = 0;

        if (_promptTokens.size() > batchLimit) {
            const size_t drop = _promptTokens.size() - batchLimit;
            LOGi("Truncating prompt tokens: dropping %zu oldest tokens (prompt=%zu, max_batch=%u)",
                 drop, _promptTokens.size(), batchLimit);
            _promptTokens.erase(_promptTokens.begin(), _promptTokens.begin() + static_cast<long>(drop));
        }

        suffix_start = 0;
        suffix_len   = _promptTokens.size();
    }

    _lastPromptTokenCount   = _promptTokens.size();
    _lastReusedPrefixTokens = common_prefix;
    _promptSuffixStart      = suffix_start;
    if (suffix_start >= _promptTokens.size()) {
        if (suffix_start == 0) {
            LOGe("Prompt suffix is unexpectedly empty");
            throw std::runtime_error("Prompt suffix is unexpectedly empty");
        }

        LOGi("Prompt fully matched cached prefix; forcing a one-token replay for fresh logits");
        if (!llama_memory_seq_rm(memory, 0, static_cast<llama_pos>(suffix_start - 1), -1)) {
            llama_memory_clear(memory, false);
            _sessionTokens.clear();
            suffix_start = 0;
        } else {
            suffix_start -= 1;
            _sessionTokens.resize(suffix_start);
        }
    }

    // Prepare batch with only the suffix tokens that still need evaluation. The suffix
    // length has been capped so that _batch->n_tokens is always <= _batchLimit, which
    // matches ctx_params.n_batch and avoids ggml_abort inside llama_decode.
    if (!_batch) {
        _batch = new llama_batch(llama_batch_init(context_size, 0, 1));
    }

    common_batch_clear(*_batch);
    for (size_t i = suffix_start; i < _promptTokens.size(); i++) {
        const bool needs_logits = i == (_promptTokens.size() - 1);
        common_batch_add(*_batch, _promptTokens[i], static_cast<llama_pos>(i), { 0 }, needs_logits);
    }
    _isPromptEvalPending = true;
    
    LOGi("Batch filled with %d suffix tokens after reusing %zu prompt tokens (batchLimit=%u).", 
         _batch->n_tokens, common_prefix, batchLimit);
}

bool
LLMInference::_isValidUtf8(const char *response) {
    if (!response) {
        return true;
    }
    const unsigned char *bytes = (const unsigned char *) response;
    int num;
    while (*bytes != 0x00) {
        if ((*bytes & 0x80) == 0x00) {
            num = 1;
        } else if ((*bytes & 0xE0) == 0xC0) {
            num = 2;
        } else if ((*bytes & 0xF0) == 0xE0) {
            num = 3;
        } else if ((*bytes & 0xF8) == 0xF0) {
            num = 4;
        } else {
            return false;
        }

        bytes += 1;
        for (int i = 1; i < num; ++i) {
            if ((*bytes & 0xC0) != 0x80) {
                return false;
            }
            bytes += 1;
        }
    }
    return true;
}

std::string
LLMInference::completionLoop() {
    if (_responseNumTokens >= _maxOutputTokens) {
        LOGi("Generation stopped after reaching max_output_tokens=%d", _maxOutputTokens);
        if (_storeChats) {
            addChatMessage(_response.c_str(), "assistant");
        }
        _cacheResponseTokens.clear();
        _response.clear();
        return "[EOG]";
    }

    uint32_t contextSize = llama_n_ctx(_ctx);
    
    // Get current context usage BEFORE decoding
    int32_t n_ctx_used_before = llama_memory_seq_pos_max(llama_get_memory(_ctx), 0) + 1;
    
    if (n_ctx_used_before + _batch->n_tokens > contextSize) {
        LOGe("Context size reached! Used: %d, Batch: %d, Max: %d", 
             n_ctx_used_before, _batch->n_tokens, contextSize);
        throw std::runtime_error("context size reached");
    }

    // Validate batch before decoding
    if (!_batch || !_batch->token || _batch->n_tokens <= 0) {
        LOGe("Invalid batch state! n_tokens=%d", _batch ? _batch->n_tokens : -1);
        throw std::runtime_error("Invalid batch");
    }

    auto start = ggml_time_us();
    int decode_result = llama_decode(_ctx, *_batch);
    if (decode_result < 0) {
        LOGe("llama_decode() failed with code %d", decode_result);
        throw std::runtime_error("llama_decode() failed");
    }

    if (_isPromptEvalPending) {
        _sessionTokens = _promptTokens;
        _isPromptEvalPending = false;
    } else if (_batch->n_tokens == 1) {
        _sessionTokens.push_back(_batch->token[0]);
    }

    // Update context usage AFTER decoding
    _nCtxUsed = llama_memory_seq_pos_max(llama_get_memory(_ctx), 0) + 1;

    _currToken = llama_sampler_sample(_sampler, _ctx, -1);
    
    if (llama_vocab_is_eog(llama_model_get_vocab(_model), _currToken)) {
        LOGi("Generation complete: prompt_tokens=%zu reused_prefix=%zu generated_tokens=%ld ctx_used=%d speed=%.2f tok/s",
             _lastPromptTokenCount,
             _lastReusedPrefixTokens,
             _responseNumTokens,
             _nCtxUsed,
             getResponseGenerationTime());
        if (_storeChats) {
            addChatMessage(_response.c_str(), "assistant");
        }
        _cacheResponseTokens.clear();
        _response.clear();
        return "[EOG]";
    }
    
    std::string piece = common_token_to_piece(_ctx, _currToken, true);
    auto end = ggml_time_us();
    _responseGenerationTime += (end - start);
    _responseNumTokens += 1;
    _cacheResponseTokens += piece;

    // Prepare batch for next token with correct position
    common_batch_clear(*_batch);
    common_batch_add(*_batch, _currToken, _nCtxUsed, { 0 }, true);

    if (_isValidUtf8(_cacheResponseTokens.c_str())) {
        _response += _cacheResponseTokens;
        std::string valid_utf8_piece = _cacheResponseTokens;
        _cacheResponseTokens.clear();
        return valid_utf8_piece;
    }

    return "";
}

void
LLMInference::stopCompletion() {
    if (_storeChats && !_response.empty()) {
        addChatMessage(_response.c_str(), "assistant");
    }
    _cacheResponseTokens.clear();
    _response.clear();
}

LLMInference::~LLMInference() {
    clearChatHistory();
    
    if (_ctx) {
        llama_free(_ctx);
    }
    if (_model) {
        llama_model_free(_model);
    }
    if (_batch) {
        llama_batch_free(*_batch);
        delete _batch;
    }
    if (_sampler) {
        llama_sampler_free(_sampler);
    }
    if (_ownsChatTemplate && _chatTemplate != nullptr) {
        free(const_cast<char *>(_chatTemplate));
    }
    
    llama_backend_free();
}

std::string
LLMInference::benchModel(int pp, int tg, int pl, int nr) {
    llama_batch g_batch = llama_batch_init(pp, 0, pl);
    auto pp_avg = 0.0;
    auto tg_avg = 0.0;
    auto pp_std = 0.0;
    auto tg_std = 0.0;

    const uint32_t n_ctx = llama_n_ctx(this->_ctx);
    LOGi("n_ctx = %d", n_ctx);

    int i, j;
    int nri;
    for (nri = 0; nri < nr; nri++) {
        LOGi("Benchmark prompt processing (pp = %d)", pp);

        common_batch_clear(g_batch);

        const int n_tokens = pp;
        for (i = 0; i < n_tokens; i++) {
            common_batch_add(g_batch, 1, i, { 0 }, false);
        }

        g_batch.logits[g_batch.n_tokens - 1] = true;
        llama_memory_clear(llama_get_memory(_ctx), false);

        const auto t_pp_start = ggml_time_us();
        if (llama_decode(this->_ctx, g_batch) != 0) {
            LOGe("llama_decode() failed during prompt processing");
        }
        const auto t_pp_end = ggml_time_us();

        LOGi("Benchmark text generation (tg = %d)", tg);

        llama_memory_clear(llama_get_memory(_ctx), false);
        const auto t_tg_start = ggml_time_us();
        for (i = 0; i < tg; i++) {
            common_batch_clear(g_batch);
            for (j = 0; j < pl; j++) {
                common_batch_add(g_batch, 0, i, { j }, true);
            }

            if (llama_decode(this->_ctx, g_batch) != 0) {
                LOGe("llama_decode() failed during text generation");
            }
        }
        const auto t_tg_end = ggml_time_us();

        llama_memory_clear(llama_get_memory(_ctx), false);

        const auto t_pp = double(t_pp_end - t_pp_start) / 1000000.0;
        const auto t_tg = double(t_tg_end - t_tg_start) / 1000000.0;

        const auto speed_pp = double(pp) / t_pp;
        const auto speed_tg = double(pl * tg) / t_tg;

        pp_avg += speed_pp;
        tg_avg += speed_tg;

        pp_std += speed_pp * speed_pp;
        tg_std += speed_tg * speed_tg;

        LOGi("pp %f t/s, tg %f t/s", speed_pp, speed_tg);
    }

    llama_batch_free(g_batch);

    pp_avg /= double(nr);
    tg_avg /= double(nr);

    if (nr > 1) {
        pp_std = sqrt(pp_std / double(nr - 1) - pp_avg * pp_avg * double(nr) / double(nr - 1));
        tg_std = sqrt(tg_std / double(nr - 1) - tg_avg * tg_avg * double(nr) / double(nr - 1));
    } else {
        pp_std = 0;
        tg_std = 0;
    }

    char model_desc[128];
    llama_model_desc(this->_model, model_desc, sizeof(model_desc));

    const auto model_size     = double(llama_model_size(this->_model)) / 1024.0 / 1024.0 / 1024.0;
    const auto model_n_params = double(llama_model_n_params(this->_model)) / 1e9;

    std::vector<std::string> backends;
    for (size_t i = 0; i < ggml_backend_reg_count(); i++) {
        auto*       reg  = ggml_backend_reg_get(i);
        std::string name = ggml_backend_reg_name(reg);
        if (name != "CPU") {
            backends.push_back(ggml_backend_reg_name(reg));
        }
    }
    std::ostringstream str;
    for (size_t i = 0; i < backends.size(); i++) {
        str << backends[i];
        if (i < backends.size() - 1) {
            str << ",";
        }
    }
    const auto backend = str.str();

    std::stringstream result;
    result << std::setprecision(3);
    result << "| model | size | params | backend | test | t/s |\n";
    result << "| --- | --- | --- | --- | --- | --- |\n";
    result << "| " << model_desc << " | " << model_size << "GiB | " << model_n_params << "B | " << backend << " | pp "
           << pp << " | " << pp_avg << " ± " << pp_std << " |\n";
    result << "| " << model_desc << " | " << model_size << "GiB | " << model_n_params << "B | " << backend << " | tg "
           << tg << " | " << tg_avg << " ± " << tg_std << " |\n";
    return result.str();
}