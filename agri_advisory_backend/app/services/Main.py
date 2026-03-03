import os
from Embedding_and_Retrivel import (
    init_minirag,
    add_json_files,
    retrieve_with_minirag,
    gemini_generate
)

# ---------------- MAIN ----------------

if __name__ == "__main__":

    # 1. Initialize MiniRAG
    rag = init_minirag()

    # 2. Index JSON (force rebuild each run to ensure embeddings are stored)
    add_json_files(rag, [r"D:\FINAL_YEAR\React_App_new\AgriApp_frontend_and_backend\agri_advisory_backend\app\dataset\pest.json",r"D:\FINAL_YEAR\React_App_new\AgriApp_frontend_and_backend\agri_advisory_backend\app\dataset\weed.json",r"D:\FINAL_YEAR\React_App_new\AgriApp_frontend_and_backend\agri_advisory_backend\app\dataset\village_plant_disease_dataset.json"])

    # 3. Ask a question
    question = "Groundnut weeds control_methods"
    print("\nQuestion:", question)

    # 🔹 Normalize query for better retrieval
    query = f"{question.lower().strip()}"

    # 4. Retrieve context
    results = retrieve_with_minirag(rag, query)

    # 🔹 SAFETY: If no context found, do NOT call Gemini
    if not results:
        print("\n❌ No relevant information found in the documents.")
    else:
        print("\n================ CONTEXT USED ================\n")
        for i, doc in enumerate(results):
            print(f"[Chunk {i+1}]\n{doc[:500]}\n")
        print("==============================================\n")

        # 5. Generate answer
        context = "\n\n".join(results)
        answer = gemini_generate(context, question)

        print("\nANSWER:\n", answer)
