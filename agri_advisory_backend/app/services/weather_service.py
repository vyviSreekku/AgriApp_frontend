import requests
from fastapi import HTTPException
from ..config import settings
import logging
import json

logging.basicConfig(level=logging.INFO)

class WeatherService:
    def __init__(self):
        self.api_key = settings.GOOGLE_WEATHER_API_KEY  # Update your config.py and .env accordingly
        print(f"WeatherService initialized with API key: {self.api_key[:5]}...")

    def get_location_name(self, latitude: float, longitude: float):
        url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={self.api_key}"
        try:
            print(f"Fetching location from: {url.replace(self.api_key, 'API_KEY_HIDDEN')}")
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            print(f"Location API response: {json.dumps(data, indent=2)}")
            
            if data.get("results"):
                # Get the locality and administrative areas from the results
                address_components = data["results"][0]["address_components"]
                locality = None
                sublocality = None
                administrative_area = None
                
                for component in address_components:
                    if "locality" in component["types"]:
                        locality = component["long_name"]
                    if "sublocality" in component["types"]:
                        sublocality = component["long_name"]
                    if "administrative_area_level_1" in component["types"]:
                        administrative_area = component["short_name"]
                
                # Extract district and state for agricultural data
                district = None
                state = None

                for component in address_components:
                    if "administrative_area_level_2" in component["types"]:
                        district = component["long_name"]
                    if "administrative_area_level_1" in component["types"]:
                        state = component["long_name"]

                
                # Create a formatted location name - prioritizing the most relevant info
                if locality and sublocality:
                    location = f"{locality}, {sublocality}"
                elif locality:
                    location = locality
                elif sublocality:
                    location = sublocality
                else:
                    location = data["results"][0]["formatted_address"]

                # Create a more detailed location object for agricultural data needs
                location_data = {
                    "display_name": location,
                    "locality": locality,
                    "sublocality": sublocality,
                    "district": district,
                    "state": state,
                    "full_address": data["results"][0]["formatted_address"],
                    # Include all results (raw) so caller can store them; keep as-is for debugging
                    "all_results": data.get("results", [])
                }
                
                print(f"Location found: {location}")
                print(f"Location data: {location_data}")
                # For display we will use only the first (primary) location but return full details
                return location_data
                
            print(f"No location results for coordinates: {latitude}, {longitude}")
            return {
                "display_name": f"Unknown location ({latitude}, {longitude})",
                "locality": None,
                "sublocality": None,
                "district": None,
                "state": None,
                "full_address": f"Unknown location ({latitude}, {longitude})"
            }
        except requests.exceptions.RequestException as e:
            print(f"Error fetching location: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch location: {e}")


    def get_weather(self, latitude, longitude):
        url = (
            "https://weather.googleapis.com/v1/currentConditions:lookup"
            f"?key={self.api_key}&location.latitude={latitude}&location.longitude={longitude}"
        )
        try:
            print(f"Fetching weather from: {url.replace(self.api_key, 'API_KEY_HIDDEN')}")
            response = requests.get(url)
            print(f"Weather API status code: {response.status_code}")
            response.raise_for_status()
            
            data = response.json()
            print(f"Weather API response: {json.dumps(data, indent=2)}")
            return data
        except requests.exceptions.HTTPError as errh:
            print(f"HTTP error: {errh}")
            raise HTTPException(status_code=502, detail=f"HTTP error: {errh}")
        except requests.exceptions.ConnectionError as errc:
            print(f"Connection error: {errc}")
            raise HTTPException(status_code=502, detail=f"Connection error: {errc}")
        except requests.exceptions.Timeout as errt:
            print(f"Timeout error: {errt}")
            raise HTTPException(status_code=504, detail=f"Timeout error: {errt}")
        except requests.exceptions.RequestException as err:
            print(f"Request exception: {err}")
            raise HTTPException(status_code=500, detail=f"An error occurred: {err}")

    def format_weather(self, weather_data, location_data=None):
        print(f"Formatting weather data for location: {location_data}")
        
        # Get display name for backward compatibility
        location_name = location_data.get("display_name", "Unknown") if isinstance(location_data, dict) else location_data
        
        if not weather_data:
            print("Warning: No weather data available")
            raise HTTPException(status_code=404, detail="No weather data available.")
        
        try:
            # Access nested data
            condition = weather_data.get("weatherCondition", {}).get("description", {}).get("text", "N/A")
            print(f"Weather condition: {condition}")
        except Exception as e:
            print(f"Error processing weather condition: {e}")
            logging.error(f"Error processing weather data: {e}")
            condition = "Error"
            
        temperature = weather_data.get("temperature", {}).get("degrees", "N/A")
        unit = weather_data.get("temperature", {}).get("unit", "N/A")
        humidity = weather_data.get("relativeHumidity", "N/A")
        uv_index = weather_data.get("uvIndex", "N/A")
        wind_speed = weather_data.get("windChill", {}).get("degrees", "N/A")
        
        print(f"Extracted values - Temp: {temperature}{unit}, Humidity: {humidity}, UV: {uv_index}")
        
        # Format the response to match what frontend expects
        result = {
            "location": location_name,
            "location_data": location_data if isinstance(location_data, dict) else {"display_name": location_name},
            "condition": condition,
            "temperature": f"{temperature} {unit}",
            "temperature_value": temperature,  # Add numeric value for calculations
            "temperature_unit": unit,          # Add unit separately 
            "humidity": humidity,
            "uv_index": uv_index,
            "wind_chill": f"{wind_speed} {unit}",
            "timestamp": weather_data.get("observationTime", {}).get("observationDateTime", "N/A"),
            "debug_raw_data": weather_data  # Include raw data temporarily for debugging
        }
        
        print(f"Final formatted result: {json.dumps(result, indent=2)}")
        return result
        
    def get_forecast(self, latitude, longitude, days=4):
        """
        Get weather forecast using Google Weather API forecast endpoint.
        
        This implementation uses the Google Weather API's forecast/days:lookup endpoint
        to fetch detailed weather forecast data for multiple days.
        """
        print(f"Getting forecast for lat:{latitude}, lon:{longitude}, days:{days}")
        
        # Get location data for the response
        location_data = self.get_location_name(latitude, longitude)
        
        # Use Google Weather API's forecast endpoint
        url = (
            "https://weather.googleapis.com/v1/forecast/days:lookup"
            f"?key={self.api_key}"
            f"&location.latitude={latitude}"
            f"&location.longitude={longitude}"
            f"&days={days}"
        )
        
        try:
            print(f"Fetching forecast from: {url.replace(self.api_key, 'API_KEY_HIDDEN')}")
            response = requests.get(url)
            print(f"Forecast API status code: {response.status_code}")
            response.raise_for_status()
            
            # Parse the Google Weather API response
            data = response.json()
            print(f"Raw forecast data: {json.dumps(data, indent=2)[:1000]}...")  # Truncated for log readability
            
            from datetime import datetime, timedelta
            
            # Process Google Weather API forecast response
            forecast_days = []
        except requests.exceptions.HTTPError as errh:
            print(f"HTTP error: {errh}")
            # Try to get response text for more info
            try:
                print(f"Response text: {response.text[:500]}...")  # Show first part of response on error
            except:
                pass
            raise HTTPException(status_code=502, detail=f"HTTP error: {errh}")
        except requests.exceptions.ConnectionError as errc:
            print(f"Connection error: {errc}")
            raise HTTPException(status_code=502, detail=f"Connection error: {errc}")
        except requests.exceptions.Timeout as errt:
            print(f"Timeout error: {errt}")
            raise HTTPException(status_code=504, detail=f"Timeout error: {errt}")
        except requests.exceptions.RequestException as err:
            print(f"Request exception: {err}")
            raise HTTPException(status_code=500, detail=f"An error occurred: {err}")
            
        # Check if forecast data is available
        if not data or "forecastDays" not in data:
            print("No forecast data available from Google Weather API.")
            # Return empty result
            location_display = location_data.get("display_name", "Unknown") if isinstance(location_data, dict) else str(location_data)
            result = {
                "location": location_display,
                "location_data": location_data,
                "forecast_days": 0,
                "days": [],
                "api_source": "Google Weather API"
            }
            return result
            
        # Process each forecast day
        for day in data["forecastDays"]:
                # Extract date information
                date = day.get("displayDate", {})
                date_str = f"{date.get('year', '')}-{date.get('month', ''):02}-{date.get('day', ''):02}"
                
                # Extract daytime forecast
                dayf = day.get("daytimeForecast", {})
                day_condition = dayf.get("weatherCondition", {}).get("description", {}).get("text", "Unknown")
                day_temp = day.get("maxTemperature", {}).get("degrees", "N/A")
                day_humidity = dayf.get("relativeHumidity", 0)
                
                # Extract precipitation probability
                day_precipitation = dayf.get("precipitation", {}).get("probability", {}).get("percent", 0)
                
                # Extract nighttime forecast
                nightf = day.get("nighttimeForecast", {})
                night_condition = nightf.get("weatherCondition", {}).get("description", {}).get("text", "Unknown")
                night_temp = day.get("minTemperature", {}).get("degrees", "N/A")
                night_humidity = nightf.get("relativeHumidity", 0)
                
                # Extract sun and moon events
                sun = day.get('sunEvents', {})
                moon = day.get('moonEvents', {})
                
                # Format the forecast in a structure expected by the frontend
                forecast_days.append({
                    "date": date_str,
                    "day": {
                        "condition": day_condition,
                        "temp_max": day_temp,
                        "temp_min": night_temp,
                        "humidity": day_humidity,
                        "precipitation": day_precipitation,
                        "wind": {
                            "speed": dayf.get("wind", {}).get("speed", {}).get("value", "N/A"),
                            "unit": dayf.get("wind", {}).get("speed", {}).get("unit", ""),
                            "direction": dayf.get("wind", {}).get("direction", {}).get("cardinal", "")
                        }
                    },
                    "night": {
                        "condition": night_condition,
                        "humidity": night_humidity,
                        "precipitation": nightf.get("precipitation", {}).get("probability", {}).get("percent", 0)
                    },
                    "sun": {
                        "sunrise": sun.get("sunriseTime", "N/A"),
                        "sunset": sun.get("sunsetTime", "N/A")
                    },
                    "moon": {
                        "phase": moon.get("moonPhase", "N/A"),
                        "rise": moon.get("moonriseTimes", ["N/A"])[0] if moon.get("moonriseTimes") else "N/A",
                        "set": moon.get("moonsetTimes", ["N/A"])[0] if moon.get("moonsetTimes") else "N/A"
                    }
                })
        
        # Make sure we have the number of days requested
        if len(forecast_days) > days:
            forecast_days = forecast_days[:days]
            
        location_display = location_data.get("display_name", "Unknown") if isinstance(location_data, dict) else str(location_data)
        result = {
            "location": location_display,
            "location_data": location_data,
            "forecast_days": len(forecast_days),
            "days": forecast_days,
            "api_source": "Google Weather API"
        }
        
        print(f"Forecast result: {json.dumps(result, indent=2)}")
        return result

# Create a singleton instance
weather_service = WeatherService()
print("WeatherService singleton created")
