from fastapi import APIRouter, UploadFile, File
import random

router = APIRouter(prefix="/pest", tags=["pest"])

@router.post("/detect")
async def detect_pest(image: UploadFile = File(...)):
    """
    Detect pest from uploaded image.
    Returns dummy pest identification data.
    """
    if not image.content_type.startswith('image/'):
        return {"error": "Invalid file type. Please upload an image."}
    
    contents = await image.read()
    file_size = len(contents)
    
    pest_data = [
        {
            "name": "Aphids",
            "scientific_name": "Aphidoidea",
            "confidence": 0.87,
            "severity": "Moderate",
            "affected_crops": ["Tomatoes", "Lettuce", "Cabbage", "Roses"],
            "symptoms": [
                "Curled or distorted leaves",
                "Sticky honeydew on leaves",
                "Presence of ants",
                "Yellowing of leaves"
            ],
            "control_methods": [
                "Spray with neem oil or insecticidal soap",
                "Introduce ladybugs (natural predator)",
                "Remove affected leaves",
                "Use reflective mulches to deter"
            ],
            "prevention": [
                "Regular monitoring",
                "Avoid over-fertilizing",
                "Plant companion plants like garlic"
            ]
        },
        {
            "name": "Whiteflies",
            "scientific_name": "Aleyrodidae",
            "confidence": 0.91,
            "severity": "High",
            "affected_crops": ["Tomatoes", "Peppers", "Cotton", "Ornamentals"],
            "symptoms": [
                "Tiny white insects on leaf undersides",
                "Yellowing leaves",
                "Sooty mold on honeydew",
                "Stunted plant growth"
            ],
            "control_methods": [
                "Yellow sticky traps",
                "Spray with insecticidal soap",
                "Release parasitic wasps",
                "Reflective mulches"
            ],
            "prevention": [
                "Remove infested plants immediately",
                "Use row covers",
                "Maintain plant health"
            ]
        },
        {
            "name": "Leaf Miner",
            "scientific_name": "Liriomyza spp.",
            "confidence": 0.83,
            "severity": "Moderate",
            "affected_crops": ["Spinach", "Lettuce", "Tomatoes", "Beans"],
            "symptoms": [
                "Winding white or brown trails in leaves",
                "Blistered appearance",
                "Reduced photosynthesis",
                "Premature leaf drop"
            ],
            "control_methods": [
                "Remove and destroy affected leaves",
                "Apply neem oil",
                "Release parasitic wasps",
                "Use spinosad-based insecticides"
            ],
            "prevention": [
                "Use row covers",
                "Remove plant debris",
                "Crop rotation"
            ]
        },
        {
            "name": "Spider Mites",
            "scientific_name": "Tetranychidae",
            "confidence": 0.89,
            "severity": "High",
            "affected_crops": ["Tomatoes", "Beans", "Strawberries", "Ornamentals"],
            "symptoms": [
                "Fine webbing on plants",
                "Yellow stippling on leaves",
                "Dry, crispy leaves",
                "Reduced vigor"
            ],
            "control_methods": [
                "Spray with water to dislodge",
                "Apply neem oil or miticides",
                "Release predatory mites",
                "Prune heavily infested areas"
            ],
            "prevention": [
                "Maintain adequate humidity",
                "Avoid water stress",
                "Regular monitoring"
            ]
        },
        {
            "name": "Caterpillars",
            "scientific_name": "Lepidoptera larvae",
            "confidence": 0.94,
            "severity": "High",
            "affected_crops": ["Cabbage", "Tomatoes", "Corn", "Cotton"],
            "symptoms": [
                "Holes in leaves",
                "Visible larvae on plants",
                "Frass (droppings) on leaves",
                "Damaged fruits"
            ],
            "control_methods": [
                "Hand-pick and destroy",
                "Apply Bt (Bacillus thuringiensis)",
                "Use row covers",
                "Spray with neem oil"
            ],
            "prevention": [
                "Inspect plants regularly",
                "Encourage natural predators (birds, wasps)",
                "Crop rotation"
            ]
        }
    ]
    
    detected_pest = random.choice(pest_data)
    
    return {
        "success": True,
        "image_info": {
            "filename": image.filename,
            "size_bytes": file_size,
            "content_type": image.content_type
        },
        "detection": detected_pest,
        "timestamp": "2025-11-16T09:00:00Z",
        "note": "This is a dummy detection. Integrate ML model for real pest identification."
    }
