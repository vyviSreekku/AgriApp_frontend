import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/agri_advisory")
        self.GOOGLE_WEATHER_API_KEY = os.getenv("GOOGLE_WEATHER_API_KEY")
        self.MANDI_API_KEY = os.getenv("MANDI_API_KEY")

settings = Settings()
