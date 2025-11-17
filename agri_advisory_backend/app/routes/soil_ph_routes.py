from fastapi import APIRouter, UploadFile, File
import random

router = APIRouter(prefix="/soil-ph", tags=["soil-ph"])


@router.post("/analyze")
async def analyze_soil_ph(image: UploadFile = File(...)):
    """
    Analyze soil pH from uploaded image (pH test strip or soil sample).
    Returns only the pH value (dummy data).
    """
    if not image.content_type.startswith('image/'):
        return {"error": "Invalid file type. Please upload an image."}

    await image.read()  # Read to simulate processing
    ph_value = round(random.uniform(4.0, 9.0), 1)
    return {"ph_value": ph_value}
