from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import weather_routes

app = FastAPI()

# Set up CORS for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the weather routes
app.include_router(weather_routes.router, prefix="/api/weather", tags=["weather"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Farming Advisory API"}
