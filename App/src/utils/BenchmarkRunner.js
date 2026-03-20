import ModelManager from '../services/ModelManager';
import OfflineRagService from '../services/offlineRagService';
import { Alert } from 'react-native';

export const runFullBenchmark = async () => {
  console.log('--- STARTING FULL BENCHMARK ---');
  
  try {
    // 1. RAG Benchmark
    console.log('1. Benchmarking Offline RAG Retrieval...');
    const ragResults = await OfflineRagService.benchmarkRetrieval([
      'How to control Yellow stem borer in Rice?',
      'Preventive measures for Paddy gall midge',
      'Chemical control for Yellow stem borer',
      'Control Late Blight in Tomato',
      'Symptoms of Apple Scab',
      'Management of Fire Blight in Apple',
      'How to treat Potato Early Blight',
      'What are the symptoms of Tomato Septoria Leaf Spot?',
      'Biological control for Tomato Bacterial Spot',
      'Treatment for Apple Cedar Rust',
      'Signs of Apple Powdery Mildew',
      'Identification of Jungle rice weed',
      'Critical weedy period for transplanted rice',
      'Organic control for Yellow stem borer',
      'Favorable conditions for Tomato Early Blight',
      'Affected parts in Apple Fire Blight',
      'Cause of dead heart in rice',
      'Pathogen causing Potato Early Blight',
      'Cultural management for Tomato Septoria Leaf Spot',
      'Which fungicide to use for Apple Scab?'
    ]);
    console.log('RAG Results:', JSON.stringify(ragResults, null, 2));

    // 2. Model Inference Benchmark
    console.log('2. Benchmarking LLM Inference Speed...');
    // pp: prompt processing batch (8), tg: generation tokens (128), pl: prompt length (1), nr: runs (1)
    const modelReport = await ModelManager.benchmark({ pp: 8, tg: 128, pl: 1, nr: 3 });
    console.log('Model Benchmark Report:', modelReport);

    // 3. End-to-End QA Benchmark
    console.log('3. Benchmarking End-to-End QA (Retrieval + Generation)...');
    
    // Use the SAME questions as RAG benchmark
    const qaQuestions = [
      'How to control Yellow stem borer in Rice?',
      'Preventive measures for Paddy gall midge',
      'Chemical control for Yellow stem borer',
      'Control Late Blight in Tomato',
      'Symptoms of Apple Scab',
      'Management of Fire Blight in Apple',
      'How to treat Potato Early Blight'
    ];
    
    const qaResults = [];
    
    for (const [index, question] of qaQuestions.entries()) {
        console.log(`\n--- Question ${index + 1}/${qaQuestions.length}: "${question}" ---`);
        
        // Measure Prompt Build Time (RAG)
        const startRag = Date.now();
        // Since benchmarkRetrieval doesn't return the prompt, we call buildAugmentedPrompt directly
        // Note: buildAugmentedPrompt handles retrieval internally
        let prompt = '';
        try {
           prompt = await OfflineRagService.buildAugmentedPrompt(question);
        } catch (err) {
            console.error(`RAG Prompt Build Error: ${err.message}`);
            continue;
        }
        const ragTime = Date.now() - startRag;
        console.log(`RAG Prompt Build Time: ${ragTime}ms`);

        // Measure Generation Time
        const startGen = Date.now();
        let response = '';
        try {
            // Generate full response
            response = await new Promise((resolve, reject) => {
               let fullText = '';
               ModelManager.generate(prompt, (token) => {
                   fullText += token;
               }).then(res => resolve(res)).catch(reject);
            });
        } catch (err) {
            console.error(`Generation Error: ${err.message}`);
            continue;
        }
        const genTime = Date.now() - startGen;
        
        console.log(`LLM Generation Time: ${genTime}ms`);
        console.log(`\n🔎 GENERATED ANSWER:\n${response}\n`);
        
        qaResults.push({
            question,
            ragPromptBuildTimeMs: ragTime,
            llmGenerationTimeMs: genTime,
            responseLength: response.length,
            answer: response 
        });
    }

    console.log('--- End-to-End Benchmark Complete ---');
    console.log(JSON.stringify(qaResults, null, 2));

    Alert.alert(
      "Benchmark Complete",
      `RAG Avg: ${ragResults.averageTimeMs}ms\n\nModel:\n${modelReport}\n\nQA Queries: ${qaResults.length}`
    );

    return {
      rag: ragResults,
      model: modelReport,
      qa: qaResults
    };

  } catch (error) {
    console.error('Benchmark Failed:', error);
    Alert.alert("Benchmark Failed", error.message);
  }
};
