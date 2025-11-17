from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/crops", tags=["crops"])

class CropRecommendationRequest(BaseModel):
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    rainfall: Optional[float] = None
    temperature: Optional[float] = None
    soil_ph: Optional[float] = Field(default=None, description="Soil pH value")


@router.post("/recommend")
def recommend_crop(req: CropRecommendationRequest):
    """Echo structured inputs and return a placeholder recommendation."""
    return {
        "recommended_crop": "wheat",
        "inputs": req.model_dump(exclude_none=True),
    }
