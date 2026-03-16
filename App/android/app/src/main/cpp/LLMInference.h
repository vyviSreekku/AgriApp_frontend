#pragma once
#include "chat.h"
#include "common.h"
#include "llama.h"
#include <string>
#include <vector>

constexpr size_t MAX_CHAT_MESSAGES = 6;

class LLMInference {
    // llama.cpp-specific types
    llama_context* _ctx;
    llama_model*   _model;
    llama_sampler* _sampler;
    llama_token    _currToken;
    llama_batch*   _batch;
    // cached context and batch limits to keep llama_decode within bounds
    uint32_t       _contextSize = 0;
    uint32_t       _batchLimit  = 0;

    // container to store user/assistant messages in the chat
    std::vector<llama_chat_message> _messages;
    // stores the string generated after applying
    // the chat-template to all messages in `_messages`
    std::vector<char> _formattedMessages;
    // stores the tokens for the last query
    // appended to `_messages`
    std::vector<llama_token> _promptTokens;
    std::vector<llama_token> _sessionTokens;
    const char*              _chatTemplate;
    bool                     _ownsChatTemplate = false;

    // stores the complete response for the given query
    std::string _response;
    std::string _cacheResponseTokens;
    // whether to cache previous messages in `_messages`
    bool _storeChats;

    // response generation metrics
    int64_t _responseGenerationTime = 0;
    long    _responseNumTokens      = 0;
    size_t  _lastPromptTokenCount   = 0;
    size_t  _lastReusedPrefixTokens = 0;
    int     _maxOutputTokens        = 80;

    // length of context window consumed during the conversation
    int _nCtxUsed = 0;
    bool _isPromptEvalPending = false;
    // index in _promptTokens where the non-reused suffix starts
    size_t _promptSuffixStart = 0;

    bool _isValidUtf8(const char* response);
    size_t countCommonPrefix(const std::vector<llama_token>& lhs, const std::vector<llama_token>& rhs) const;
    void clearChatHistory();
    void resetRuntimeState(bool clearChatHistory, bool clearKvCache);
    void trimChatHistory();

  public:
    LLMInference();

    void loadModel(const char* modelPath, float minP, float temperature, bool storeChats, long contextSize,
             const char* chatTemplate, int nThreads, int nThreadsBatch, int batchSize, int microBatchSize,
             int maxOutputTokens, int flashAttentionType, bool offloadKqv, bool useMmap, bool useMlock);

    std::string benchModel(int pp, int tg, int pl, int nr);

    void addChatMessage(const char* message, const char* role);

    float getResponseGenerationTime() const;

    int getContextSizeUsed() const;

    void resetConversation();

    void startCompletion(const char* query);

    std::string completionLoop();

    void stopCompletion();

    ~LLMInference();
};