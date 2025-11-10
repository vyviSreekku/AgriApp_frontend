from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from ..services.mandi import get_crop_prices

router = APIRouter(
    tags=["market"],
    responses={404: {"description": "Not found"}},
)

@router.get("/prices")
async def get_market_prices(
    state: Optional[str] = Query(None, description="Filter by state name"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    crop: Optional[str] = Query(None, description="Filter by crop name (commodity)")
):
    """
    Get agricultural market prices from the government Mandi API.
    
    You can filter the results by state, district, or crop name.
    If no filters are provided, the API will return a sample of recent price data.
    """
    try:
        result = await get_crop_prices(state=state, district=district, crop=crop)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail="Failed to fetch market prices")
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving market prices: {str(e)}")

@router.get("/prices/summary")
async def get_market_price_summary(
    crop: str = Query(..., description="Crop name to get price summary for"),
    state: Optional[str] = Query(None, description="Filter by state name")
):
    """
    Get a summary of market prices for a specific crop.
    This endpoint provides average, min, and max prices across markets.
    """
    try:
        result = await get_crop_prices(state=state, crop=crop)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail="Failed to fetch market prices")
        
        # Calculate summary statistics if data exists
        if not result["data"]:
            return {
                "success": True,
                "crop": crop,
                "state": state,
                "summary": {
                    "markets_count": 0,
                    "average_price": None,
                    "min_price": None,
                    "max_price": None
                }
            }
        
        # Calculate statistics across markets
        markets_count = len(result["data"])
        all_modal_prices = []
        min_prices = []
        max_prices = []
        
        for market_data in result["data"]:
            for price in market_data["prices"]:
                try:
                    modal_price = float(price["modal_price"])
                    min_price = float(price["min_price"])
                    max_price = float(price["max_price"])
                    
                    all_modal_prices.append(modal_price)
                    min_prices.append(min_price)
                    max_prices.append(max_price)
                except (ValueError, TypeError):
                    # Skip invalid price values
                    pass
        
        avg_price = sum(all_modal_prices) / len(all_modal_prices) if all_modal_prices else None
        min_price_overall = min(min_prices) if min_prices else None
        max_price_overall = max(max_prices) if max_prices else None
        
        return {
            "success": True,
            "crop": crop,
            "state": state,
            "summary": {
                "markets_count": markets_count,
                "average_price": round(avg_price, 2) if avg_price is not None else None,
                "min_price": round(min_price_overall, 2) if min_price_overall is not None else None,
                "max_price": round(max_price_overall, 2) if max_price_overall is not None else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving market price summary: {str(e)}")
