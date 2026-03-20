import requests
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Union
from ..config import settings

# API Configuration
BASE_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"

def get_mandi_prices(
    state: Optional[str] = None,
    district: Optional[str] = None,
    commodity: Optional[str] = None,
    arrival_date: Optional[str] = None,
    api_key: str = None,
    format: str = "json",
    offset: int = 0,
    limit: int = 10,
    sort_by: str = "Market"
) -> Union[Dict[str, Any], str, None]:
    """
    Fetch agricultural market prices from the Mandi API.
    
    Parameters:
    - state: Filter by state
    - district: Filter by district
    - commodity: Filter by commodity (crop)
    - arrival_date: Filter by arrival date
    - api_key: API key for authentication
    - format: Output format (json, xml, csv)
    - offset: Number of records to skip
    - limit: Maximum number of records to return
    - sort_by: Sort results by field
    
    Returns:
    - The API response in the specified format
    """
    # Use the API key from settings if not provided
    if api_key is None:
        api_key = settings.MANDI_API_KEY
        
    params = {
        "api-key": api_key,
        "format": format,
        "offset": offset,
        "limit": limit
    }
    
    # Add filters if provided
    if state:
        params["filters[State]"] = state
    if district:
        params["filters[District]"] = district
    if commodity:
        params["filters[Commodity]"] = commodity
    if arrival_date:
        params["filters[Arrival_Date]"] = arrival_date
    
    # Add sort parameter if provided
    if sort_by:
        params[f"sort[{sort_by}]"] = "asc"
    
    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()  # Raise exception for bad responses
        
        if format == "json":
            return response.json()
        else:
            return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching mandi data: {e}")
        return None

def process_mandi_data(data: Dict[str, Any], max_records: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Process the mandi API response and return structured data.
    
    Parameters:
    - data: The API response data (in JSON format)
    - max_records: Maximum number of records to process
    
    Returns:
    - List of processed market price records
    """
    processed_data = []
    
    # Check if data is valid
    if not data or not isinstance(data, dict):
        return processed_data
    
    # Check for error in the API response
    if "error" in data:
        print(f"API Error: {data.get('error', {}).get('message', 'Unknown error')}")
        return processed_data
    
    # Check if records exist in the data
    records = data.get("records", [])
    if not records:
        return processed_data
    
    # Limit the number of records to process
    if max_records and max_records < len(records):
        records_to_process = records[:max_records]
    else:
        records_to_process = records
    
    # Group records by Market and Commodity for better organization
    market_commodity_groups = {}
    for record in records_to_process:
        market = record.get("Market", "Unknown Market")
        commodity = record.get("Commodity", "Unknown Commodity")
        key = f"{market}|{commodity}"
        
        if key not in market_commodity_groups:
            market_commodity_groups[key] = []
        
        market_commodity_groups[key].append(record)
    
    # Process each group
    for key, group_records in market_commodity_groups.items():
        parts = key.split("|", 1)
        market = parts[0]
        commodity = parts[1] if len(parts) > 1 else "Unknown"
        
        # Sort records by arrival date (newest first)
        sorted_records = sorted(
            group_records, 
            key=lambda x: datetime.strptime(x.get("Arrival_Date", "01/01/2000"), "%d/%m/%Y"), 
            reverse=True
        )
        
        group_data = {
            "market": market,
            "commodity": commodity,
            "prices": []
        }
        
        for record in sorted_records:
            # Format date for better readability
            arrival_date = record.get("Arrival_Date", "N/A")
            try:
                date_obj = datetime.strptime(arrival_date, "%d/%m/%Y")
                formatted_date = date_obj.strftime("%d %b %Y")
            except:
                formatted_date = arrival_date
            
            price_data = {
                "date": formatted_date,
                "raw_date": arrival_date,
                "variety": record.get("Variety", "N/A"),
                "grade": record.get("Grade", "N/A"),
                "min_price": record.get("Min_Price", "N/A"),
                "max_price": record.get("Max_Price", "N/A"),
                "modal_price": record.get("Modal_Price", "N/A"),
                "state": record.get("State", "N/A"),
                "district": record.get("District", "N/A")
            }
            group_data["prices"].append(price_data)
        
        processed_data.append(group_data)
    
    return processed_data

async def get_crop_prices(
    state: Optional[str] = None,
    district: Optional[str] = None,
    crop: Optional[str] = None,
    arrival_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get crop prices from the Mandi API as a service for the FastAPI backend.
    
    Parameters:
    - state: Filter by state
    - district: Filter by district
    - crop: Filter by crop name (commodity)
    
    Returns:
    - Dictionary containing processed market price data and metadata
    """
    # Set a reasonable limit for API calls
    limit = 10

    # If no arrival_date is provided, start from today's date (dd/mm/YYYY)
    # and move backwards day by day (up to ~1 month) until some data is found.
    if arrival_date is None:
        start_date = datetime.now()
    else:
        # Parse provided arrival_date; if parsing fails, fall back to today
        try:
            start_date = datetime.strptime(arrival_date, "%d/%m/%Y")
        except ValueError:
            start_date = datetime.now()

    data = None
    effective_date_str = None

    for day_offset in range(0, 31):  # today and previous 30 days
        query_date = start_date - timedelta(days=day_offset)
        date_str = query_date.strftime("%d/%m/%Y")

        data = get_mandi_prices(
            state=state,
            district=district,
            commodity=crop,
            arrival_date=date_str,
            limit=limit,
        )

        if not data or not isinstance(data, dict):
            continue

        # Skip if API reported error or returned no records
        if "error" in data or not data.get("records"):
            continue

        effective_date_str = date_str
        break
    
    result = {
        "success": False,
        "data": [],
        "metadata": {
            "total_records": 0,
            "fetched_records": 0,
            "updated_date": None,
            "state": state,
            "district": district,
            "crop": crop,
            # The actual Arrival_Date used for the successful query (dd/mm/YYYY)
            "effective_arrival_date": effective_date_str,
        },
    }

    if data and isinstance(data, dict) and effective_date_str is not None:
        # Extract metadata
        result["success"] = True
        result["metadata"]["total_records"] = data.get("total", 0)
        result["metadata"]["fetched_records"] = len(data.get("records", []))
        result["metadata"]["updated_date"] = data.get("updated_date", None)

        # Process the data
        result["data"] = process_mandi_data(data)

    return result
