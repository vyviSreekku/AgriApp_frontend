from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import weather_routes, market_routes

app = FastAPI()

# Set up CORS for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routes
app.include_router(weather_routes.router, prefix="/weather", tags=["weather"])
app.include_router(market_routes.router, prefix="/market", tags=["market"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Farming Advisory API"}
