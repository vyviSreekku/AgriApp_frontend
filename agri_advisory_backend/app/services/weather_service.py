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

            # Robust extraction of short_name from all results
            short_name = None
            district = None
            state = None
            locality = None
            sublocality = None
            formatted_address = None
            display_name = None

            if data.get("results"):
                # Search all results for the best short_name
                for result in data["results"]:
                    ac = result.get("address_components", [])
                    for component in ac:
                        if not short_name and "locality" in component["types"]:
                            short_name = component["long_name"]
                        if not short_name and "sublocality" in component["types"]:
                            short_name = component["long_name"]
                        if not short_name and "administrative_area_level_2" in component["types"]:
                            short_name = component["long_name"]
                        if not district and "administrative_area_level_2" in component["types"]:
                            district = component["long_name"]
                        if not state and "administrative_area_level_1" in component["types"]:
                            state = component["long_name"]
                        if not locality and "locality" in component["types"]:
                            locality = component["long_name"]
                        if not sublocality and "sublocality" in component["types"]:
                            sublocality = component["long_name"]
                    if not formatted_address and result.get("formatted_address"):
                        formatted_address = result["formatted_address"]
                # Fallback: use first part of formatted_address if no short_name found
                if not short_name and formatted_address:
                    short_name = formatted_address.split(",")[0].strip()
                # Compose display_name
                if locality and sublocality:
                    display_name = f"{locality}, {sublocality}"
                elif locality:
                    display_name = locality
                elif sublocality:
                    display_name = sublocality
                else:
                    display_name = formatted_address or f"Unknown location ({latitude}, {longitude})"

                location_data = {
                    "short_name": short_name or "Unknown",
                    "display_name": display_name,
                    "formatted_address": formatted_address or f"Unknown location ({latitude}, {longitude})",
                    "locality": locality,
                    "sublocality": sublocality,
                    "district": district,
                    "state": state,
                    "coordinates": {
                        "lat": latitude,
                        "lon": longitude
                    }
                }
                print(f"Location found: {display_name}")
                print(f"Location data: {location_data}")
                return location_data

            print(f"No location results for coordinates: {latitude}, {longitude}")
            return {
                "short_name": "Unknown",
                "display_name": f"Unknown location ({latitude}, {longitude})",
                "formatted_address": f"Unknown location ({latitude}, {longitude})",
                "locality": None,
                "sublocality": None,
                "district": None,
                "state": None,
                "coordinates": {
                    "lat": latitude,
                    "lon": longitude
                }
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

        # --- Combine geolocation and weather API location data ---
        # Try to extract a location name from the weather API response if present
        weather_location = None
        for key in ["locationName", "resolvedAddress", "address", "name"]:
            if key in weather_data:
                weather_location = weather_data[key]
                break
        # Use geolocation short_name, display_name, and weather_location (if present)
        geo_short = location_data.get("short_name") if isinstance(location_data, dict) else None
        geo_display = location_data.get("display_name") if isinstance(location_data, dict) else None
        geo_full = location_data.get("formatted_address") if isinstance(location_data, dict) else None
        # Build a combined, deduplicated location string (most specific first)
        combined_parts = []
        for part in [weather_location, geo_short, geo_display, geo_full]:
            if part and part not in combined_parts:
                combined_parts.append(part)
        combined_location = ", ".join([p for p in combined_parts if p and p != "Unknown"]) or "Unknown"

        # Add a combined_location field to the response
        result = {
            "location": combined_location,
            "location_data": location_data if isinstance(location_data, dict) else {"display_name": location_name},
            "condition": condition,
            "temperature": f"{temperature} {unit}",
            "temperature_value": temperature,  # Add numeric value for calculations
            "temperature_unit": unit,          # Add unit separately 
            "humidity": humidity,
            "uv_index": uv_index,
            "wind_chill": f"{wind_speed} {unit}",
            "timestamp": weather_data.get("observationTime", {}).get("observationDateTime", "N/A"),
            "debug_raw_data": weather_data,  # Include raw data temporarily for debugging
            "combined_location": combined_location
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
