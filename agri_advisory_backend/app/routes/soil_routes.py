from fastapi import APIRouter, UploadFile, File
from typing import Optional
import random

router = APIRouter(prefix="/soil", tags=["soil"])

@router.post("/analyze")
async def analyze_soil(image: UploadFile = File(...)):
    """
    Analyze soil type from uploaded image.
    Returns dummy soil classification data for now.
    """
    # Validate image file
    if not image.content_type.startswith('image/'):
        return {"error": "Invalid file type. Please upload an image."}
    
    # Read image data (not processing for dummy response)
    contents = await image.read()
    file_size = len(contents)
    
    # Dummy soil types with characteristics
    soil_types = [
        {
            "type": "Clay Soil",
            "confidence": 0.89,
            "color": "#8B4513",
            "characteristics": {
                "texture": "Fine and sticky",
                "drainage": "Poor",
                "nutrient_retention": "High",
                "water_holding_capacity": "Very High"
            },
            "ph_range": "6.0 - 7.5",
            "suitable_crops": ["Rice", "Wheat", "Sugarcane", "Cotton"],
            "recommendations": [
                "Add organic matter to improve drainage",
                "Avoid working when wet",
                "Consider raised beds for better aeration"
            ]
        },
        {
            "type": "Sandy Soil",
            "confidence": 0.85,
            "color": "#F4A460",
            "characteristics": {
                "texture": "Coarse and gritty",
                "drainage": "Excellent",
                "nutrient_retention": "Low",
                "water_holding_capacity": "Low"
            },
            "ph_range": "5.5 - 7.0",
            "suitable_crops": ["Carrots", "Radish", "Potatoes", "Millet"],
            "recommendations": [
                "Add compost to improve water retention",
                "Mulch to reduce moisture loss",
                "Apply fertilizers frequently in small amounts"
            ]
        },
        {
            "type": "Loamy Soil",
            "confidence": 0.92,
            "color": "#8B7355",
            "characteristics": {
                "texture": "Balanced mixture",
                "drainage": "Good",
                "nutrient_retention": "High",
                "water_holding_capacity": "Moderate"
            },
            "ph_range": "6.0 - 7.0",
            "suitable_crops": ["Tomatoes", "Cabbage", "Maize", "Beans", "Most vegetables"],
            "recommendations": [
                "Maintain organic matter levels",
                "Practice crop rotation",
                "Ideal for most crops with minimal amendment"
            ]
        },
        {
            "type": "Silt Soil",
            "confidence": 0.78,
            "color": "#D2B48C",
            "characteristics": {
                "texture": "Smooth and powdery when dry",
                "drainage": "Moderate",
                "nutrient_retention": "High",
                "water_holding_capacity": "High"
            },
            "ph_range": "6.0 - 7.5",
            "suitable_crops": ["Wheat", "Barley", "Soybeans", "Clover"],
            "recommendations": [
                "Avoid compaction by reducing tillage",
                "Add organic matter for structure",
                "Use cover crops to prevent erosion"
            ]
        },
        {
            "type": "Peaty Soil",
            "confidence": 0.81,
            "color": "#3E2723",
            "characteristics": {
                "texture": "Spongy and organic",
                "drainage": "Good",
                "nutrient_retention": "High",
                "water_holding_capacity": "Very High"
            },
            "ph_range": "4.0 - 6.0",
            "suitable_crops": ["Blueberries", "Cranberries", "Root vegetables"],
            "recommendations": [
                "May need lime to raise pH",
                "Rich in organic nutrients",
                "Excellent for acid-loving plants"
            ]
        }
    ]
    
    # Pick a random soil type as dummy response
    detected_soil = random.choice(soil_types)
    
    return {
        "success": True,
        "image_info": {
            "filename": image.filename,
            "size_bytes": file_size,
            "content_type": image.content_type
        },
        "analysis": detected_soil,
        "timestamp": "2025-11-16T08:30:00Z",
        "note": "This is a dummy analysis. Integrate ML model for real predictions."
    }
