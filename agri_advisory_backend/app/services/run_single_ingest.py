from app.services.Embedding_and_Retrivel import init_minirag, add_json_files
import os

TEST_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'tmp_small.json'))

if __name__ == '__main__':
    print(f"[RUNNER] Using test file: {TEST_FILE}")
    rag = init_minirag()
    add_json_files(rag, [TEST_FILE])
    print("[RUNNER] Ingest finished. Check minirag_storage files.")
