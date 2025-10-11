from fastapi import APIRouter, HTTPException, Query
from app.services.weather_service import weather_service
import sys

router = APIRouter()

@router.get("/current")
async def get_current_weather(lat: float = Query(...), lon: float = Query(...)):
    """
    Get current weather for coordinates
    """
    print(f"Received request for current weather at lat:{lat}, lon:{lon}", file=sys.stderr)
    try:
        weather_data = weather_service.get_weather(lat, lon)
        location_name = weather_service.get_location_name(lat, lon)
        formatted_data = weather_service.format_weather(weather_data, location_name)
        print(f"Returning weather response for {location_name}", file=sys.stderr)
        return formatted_data
    except Exception as e:
        print(f"Error in current weather endpoint: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast")
async def get_weather_forecast(lat: float = Query(...), lon: float = Query(...), days: int = Query(4)):
    """
    Get weather forecast for coordinates (defaults to 4 days)
    """
    print(f"Received request for forecast at lat:{lat}, lon:{lon}, days:{days}", file=sys.stderr)
    try:
        forecast_data = weather_service.get_forecast(lat, lon, days)
        print(f"Returning forecast response", file=sys.stderr)
        return forecast_data
    except Exception as e:
        print(f"Error in forecast endpoint: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))
