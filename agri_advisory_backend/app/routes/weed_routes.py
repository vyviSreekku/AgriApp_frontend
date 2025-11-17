from fastapi import APIRouter, UploadFile, File
import random

router = APIRouter(prefix="/weed", tags=["weed"])

@router.post("/detect")
async def detect_weed(image: UploadFile = File(...)):
    """
    Detect weed from uploaded image.
    Returns dummy weed identification data.
    """
    if not image.content_type.startswith('image/'):
        return {"error": "Invalid file type. Please upload an image."}
    
    contents = await image.read()
    file_size = len(contents)
    
    weed_data = [
        {
            "name": "Crabgrass",
            "scientific_name": "Digitaria spp.",
            "confidence": 0.88,
            "category": "Grass Weed",
            "growth_pattern": "Annual",
            "common_locations": ["Lawns", "Gardens", "Crop fields", "Roadsides"],
            "characteristics": [
                "Low-growing with stems radiating from center",
                "Light green to reddish color",
                "Spreads rapidly by seeds",
                "Thrives in hot weather"
            ],
            "control_methods": [
                "Hand-pull when young",
                "Apply pre-emergent herbicides in spring",
                "Maintain thick, healthy lawn",
                "Use corn gluten meal as natural control",
                "Mulch garden beds heavily"
            ],
            "prevention": [
                "Mow lawn at proper height (3 inches)",
                "Water deeply but infrequently",
                "Overseed bare patches",
                "Improve soil quality"
            ]
        },
        {
            "name": "Dandelion",
            "scientific_name": "Taraxacum officinale",
            "confidence": 0.92,
            "category": "Broadleaf Weed",
            "growth_pattern": "Perennial",
            "common_locations": ["Lawns", "Pastures", "Gardens", "Waste areas"],
            "characteristics": [
                "Yellow flowers turning to white seed heads",
                "Deep taproot (up to 10 inches)",
                "Rosette of toothed leaves",
                "Spreads by wind-dispersed seeds"
            ],
            "control_methods": [
                "Dig out entire taproot",
                "Apply broadleaf herbicide",
                "Pour boiling water on roots",
                "Use vinegar solution (20% acetic acid)",
                "Apply corn gluten meal"
            ],
            "prevention": [
                "Maintain dense turf",
                "Overseed regularly",
                "Improve soil fertility",
                "Remove before seed formation"
            ]
        },
        {
            "name": "Bindweed",
            "scientific_name": "Convolvulus arvensis",
            "confidence": 0.85,
            "category": "Vine Weed",
            "growth_pattern": "Perennial",
            "common_locations": ["Crop fields", "Gardens", "Fences", "Roadsides"],
            "characteristics": [
                "Twining stems that wrap around plants",
                "White or pink funnel-shaped flowers",
                "Arrow-shaped leaves",
                "Extensive root system"
            ],
            "control_methods": [
                "Persistent hand-pulling over several seasons",
                "Smother with black plastic or cardboard",
                "Apply systemic herbicide (glyphosate)",
                "Remove roots as deeply as possible",
                "Plant competitive ground covers"
            ],
            "prevention": [
                "Monitor regularly for new growth",
                "Improve soil drainage",
                "Use mulch barriers",
                "Never let it flower or seed"
            ]
        },
        {
            "name": "Pigweed",
            "scientific_name": "Amaranthus spp.",
            "confidence": 0.90,
            "category": "Broadleaf Weed",
            "growth_pattern": "Annual",
            "common_locations": ["Crop fields", "Gardens", "Disturbed soil", "Pastures"],
            "characteristics": [
                "Upright growth up to 6 feet",
                "Oval to diamond-shaped leaves",
                "Green flower spikes",
                "Fast-growing and prolific seeder"
            ],
            "control_methods": [
                "Hoe or hand-pull when young",
                "Apply pre-emergent herbicides",
                "Use mulch to prevent germination",
                "Cultivate regularly",
                "Mow before seed set"
            ],
            "prevention": [
                "Rotate crops",
                "Plant cover crops",
                "Use certified clean seed",
                "Remove before flowering"
            ]
        },
        {
            "name": "Nutsedge",
            "scientific_name": "Cyperus spp.",
            "confidence": 0.86,
            "category": "Sedge",
            "growth_pattern": "Perennial",
            "common_locations": ["Wet areas", "Gardens", "Lawns", "Agricultural fields"],
            "characteristics": [
                "Triangular stems",
                "Yellowish-green or purple-tinged",
                "Grows faster than grass",
                "Underground tubers (nutlets)"
            ],
            "control_methods": [
                "Improve drainage",
                "Hand-pull including tubers",
                "Apply selective herbicides (halosulfuron)",
                "Solarize soil with clear plastic",
                "Repeated cultivation"
            ],
            "prevention": [
                "Fix drainage issues",
                "Maintain healthy turf",
                "Avoid overwatering",
                "Remove plants before tuber formation"
            ]
        }
    ]
    
    detected_weed = random.choice(weed_data)
    
    return {
        "success": True,
        "image_info": {
            "filename": image.filename,
            "size_bytes": file_size,
            "content_type": image.content_type
        },
        "detection": detected_weed,
        "timestamp": "2025-11-16T09:00:00Z",
        "note": "This is a dummy detection. Integrate ML model for real weed identification."
    }
