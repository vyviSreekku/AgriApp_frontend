from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from app.routes import weather_routes, market_routes
from app.routes import community_routes
from app.routes import crops_routes
from app.routes import fertilizer_routes
from app.routes import soil_routes
from app.routes import pest_routes
from app.routes import weed_routes
from app.routes import soil_ph_routes
from .database import Base, engine

from .models import user  
from .models import crop
from .models import community_post
from .models import community_post_image
from .models import community_comment

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(lifespan=lifespan)

os.makedirs("media", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_routes.router, prefix="/weather", tags=["weather"])
app.include_router(market_routes.router, prefix="/market", tags=["market"])
app.include_router(community_routes.router)
app.include_router(crops_routes.router)
app.include_router(fertilizer_routes.router)
app.include_router(soil_routes.router)
app.include_router(pest_routes.router)
app.include_router(weed_routes.router)
app.include_router(soil_ph_routes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Farming Advisory API"}

@app.get("/health")
def health_check():
    """Simple health check endpoint for uptime probes."""
    return {"status": "ok", "service": "farming-advisory-api", "version": "1.0.0"}
