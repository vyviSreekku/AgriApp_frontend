from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/fertilizer", tags=["fertilizer"])

class FertilizerRequest(BaseModel):
    crop: Optional[str] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    soil_ph: Optional[float] = None
    rainfall: Optional[float] = None

class FertilizerRecommendation(BaseModel):
    name: str
    n: float
    p: float
    k: float
    notes: Optional[str] = None

@router.post("/recommend")
def recommend_fertilizer(req: FertilizerRequest):
    recommendations: List[FertilizerRecommendation] = [
        FertilizerRecommendation(name="Urea", n=46, p=0, k=0, notes="High nitrogen source"),
        FertilizerRecommendation(name="DAP", n=18, p=46, k=0, notes="Nitrogen & phosphorus"),
        FertilizerRecommendation(name="MOP", n=0, p=0, k=60, notes="Potassium source"),
    ]
    return {
        "crop": req.crop or "unknown",
        "inputs": req.model_dump(exclude_none=True),
        "recommendations": [r.model_dump() for r in recommendations]
    }
