# Market Price API Documentation

This API provides access to agricultural market prices from various mandis (agricultural markets) across India.

## Configuration

This API requires an API key for accessing the government Mandi API. The key is stored in the `.env` file:

```
MANDI_API_KEY=your_api_key_here
```

## Base URL

```
/api/market
```

## Endpoints

### Get Market Prices

```
GET /prices
```

Retrieves market prices filtered by state, district, and/or crop.

**Query Parameters:**

- `state` (optional): Filter by state name
- `district` (optional): Filter by district name
- `crop` (optional): Filter by crop name (commodity)

**Response Format:**

```json
{
  "success": true,
  "data": [
    {
      "market": "Market Name",
      "commodity": "Crop Name",
      "prices": [
        {
          "date": "12 Oct 2025",
          "raw_date": "12/10/2025",
          "variety": "Common",
          "grade": "FAQ",
          "min_price": "2000",
          "max_price": "2500",
          "modal_price": "2300",
          "state": "State Name",
          "district": "District Name"
        }
      ]
    }
  ],
  "metadata": {
    "total_records": 100,
    "fetched_records": 50,
    "updated_date": "12-10-2025",
    "state": "Kerala",
    "district": "Thrissur",
    "crop": "Rice"
  }
}
```

### Get Market Price Summary

```
GET /prices/summary
```

Retrieves a summary of prices for a specific crop.

**Query Parameters:**

- `crop` (required): Crop name to get price summary for
- `state` (optional): Filter by state name

**Response Format:**

```json
{
  "success": true,
  "crop": "Rice",
  "state": "Kerala",
  "summary": {
    "markets_count": 5,
    "average_price": 2350.45,
    "min_price": 2100.00,
    "max_price": 2600.00
  }
}
```

## Usage Examples

### Get all market prices for Rice in Kerala

```
GET /api/market/prices?crop=Rice&state=Kerala
```

### Get price summary for Wheat across India

```
GET /api/market/prices/summary?crop=Wheat
```

### Get all market prices for Potatoes in a specific district

```
GET /api/market/prices?crop=Potato&state=Karnataka&district=Bangalore
```