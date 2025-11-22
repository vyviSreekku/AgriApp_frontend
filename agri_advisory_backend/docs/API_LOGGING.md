# API Logging System Documentation

## Overview

The backend now includes a comprehensive API logging system that captures all requests and responses from Google Geolocation and Weather APIs. This helps with debugging, monitoring, and understanding API behavior.

## Architecture

### Components

1. **`app/utils/api_logger.py`** - Main logging utility
   - Provides structured logging for different API types
   - Creates separate log files for each API service
   - Formats logs with timestamps and structured data

2. **`app/services/weather_service.py`** - Updated to use logger
   - All API calls now logged automatically
   - Includes request parameters, responses, and errors

3. **`logs/`** - Log directory (auto-created)
   - `geolocation_api.log` - Google Geocoding API logs
   - `weather_api.log` - Google Weather API (current) logs
   - `forecast_api.log` - Google Weather API (forecast) logs

## Features

### Geolocation Logging
```python
# Logs include:
- Request coordinates (lat, lon)
- API URL (with hidden API key)
- Full JSON response from Google
- Processed location data (city, district, state)
- Error messages if any
```

### Weather Logging
```python
# Logs include:
- Request coordinates
- API URL (with hidden API key)
- Raw weather API response
- Formatted data sent to frontend
- Error messages and stack traces
```

### Forecast Logging
```python
# Logs include:
- Request coordinates and days parameter
- API URL (with hidden API key)
- Raw forecast data
- Formatted forecast sent to frontend
- Error messages if any
```

## Log Format

Each log entry follows this structure:

```
================================================================================
[REQUEST TYPE] REQUEST
Coordinates: (latitude, longitude)
Days: X (for forecast only)
URL: [sanitized URL with API_KEY_HIDDEN]
================================================================================

================================================================================
[REQUEST TYPE] RESPONSE
Coordinates: (latitude, longitude)
Status Code: 200
Raw Response Data:
{
  "full": "json response",
  "from": "google api"
}

Formatted Data:
{
  "processed": "data",
  "sent": "to frontend"
}
================================================================================
```

## Example Log Entry

### Geolocation Request
```
2025-11-22 10:30:45 - geolocation - INFO -
================================================================================
GEOLOCATION REQUEST
Coordinates: (12.9716, 77.5946)
URL: https://maps.googleapis.com/maps/api/geocode/json?latlng=12.9716,77.5946&key=API_KEY_HIDDEN
================================================================================
```

### Weather Response
```
2025-11-22 10:30:46 - weather - INFO -
================================================================================
WEATHER RESPONSE
Coordinates: (12.9716, 77.5946)
Status Code: 200
Raw Response Data:
{
  "weatherCondition": {
    "description": {"text": "Partly cloudy"}
  },
  "temperature": {"degrees": 28, "unit": "CELSIUS"}
}

Formatted Data:
{
  "location": "Bangalore, Karnataka",
  "condition": "Partly cloudy",
  "temperature": "28 CELSIUS"
}
================================================================================
```

## Usage

### Viewing Logs

Navigate to the logs directory:
```bash
cd agri_advisory_backend/logs
```

View real-time logs:
```bash
# Windows PowerShell
Get-Content geolocation_api.log -Wait -Tail 50

# View weather logs
Get-Content weather_api.log -Wait -Tail 50

# View forecast logs
Get-Content forecast_api.log -Wait -Tail 50
```

### Searching Logs

```powershell
# Find specific coordinates
Select-String "12.9716" geolocation_api.log

# Find errors
Select-String "ERROR" *.log

# Find successful requests
Select-String "Status Code: 200" weather_api.log
```

## Security

- **API Keys Protected**: All API keys are replaced with `API_KEY_HIDDEN` in logs
- **Git Ignored**: Log files are excluded from version control
- **Local Only**: Logs stored locally on the server

## Maintenance

### Log Rotation

Currently logs append indefinitely. To implement rotation:

```python
from logging.handlers import RotatingFileHandler

# In api_logger.py, replace FileHandler with:
handler = RotatingFileHandler(
    log_file,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
```

### Clearing Logs

```powershell
# Clear all logs
Remove-Item logs\*.log

# Clear specific log
Remove-Item logs\weather_api.log
```

## Benefits

1. **Debugging**: Quickly identify API response issues
2. **Monitoring**: Track API usage patterns and errors
3. **Documentation**: Understand API response formats
4. **Troubleshooting**: Trace issues from request to response
5. **Analytics**: Analyze most queried locations and times

## Integration

The logging system is automatically integrated into:
- `weather_service.get_location_name()` - Geolocation
- `weather_service.get_weather()` - Current weather
- `weather_service.get_forecast()` - Weather forecast
- `weather_service.format_weather()` - Data formatting

No additional code needed - all API calls are logged automatically!

## Future Enhancements

Potential improvements:
- [ ] Log rotation implementation
- [ ] Log aggregation and analytics dashboard
- [ ] API performance metrics (response times)
- [ ] Alert system for API errors
- [ ] Integration with monitoring tools (Sentry, DataDog)
