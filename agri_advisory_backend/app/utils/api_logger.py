"""
API Logger Utility
Logs API responses to separate files for debugging and monitoring
"""
import json
import logging
from datetime import datetime
from pathlib import Path
import os

# Create logs directory if it doesn't exist
LOGS_DIR = Path(__file__).parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Create separate log files for different APIs
GEOLOCATION_LOG = LOGS_DIR / "geolocation_api.log"
WEATHER_LOG = LOGS_DIR / "weather_api.log"
FORECAST_LOG = LOGS_DIR / "forecast_api.log"

class APILogger:
    """Logger for API requests and responses"""
    
    @staticmethod
    def _setup_logger(name: str, log_file: Path):
        """Setup a logger with file handler"""
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        
        # Remove existing handlers to avoid duplicates
        logger.handlers = []
        
        # Create file handler
        handler = logging.FileHandler(log_file, encoding='utf-8')
        handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        
        logger.addHandler(handler)
        return logger
    
    def __init__(self):
        self.geolocation_logger = self._setup_logger('geolocation', GEOLOCATION_LOG)
        self.weather_logger = self._setup_logger('weather', WEATHER_LOG)
        self.forecast_logger = self._setup_logger('forecast', FORECAST_LOG)
    
    def log_geolocation_request(self, latitude: float, longitude: float, url: str):
        """Log geolocation API request"""
        self.geolocation_logger.info(
            f"\n{'='*80}\n"
            f"GEOLOCATION REQUEST\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"URL: {url}\n"
            f"{'='*80}"
        )
    
    def log_geolocation_response(self, latitude: float, longitude: float, response_data: dict, status_code: int = 200):
        """Log geolocation API response"""
        self.geolocation_logger.info(
            f"\n{'='*80}\n"
            f"GEOLOCATION RESPONSE\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"Status Code: {status_code}\n"
            f"Response Data:\n{json.dumps(response_data, indent=2, ensure_ascii=False)}\n"
            f"{'='*80}\n"
        )
    
    def log_geolocation_error(self, latitude: float, longitude: float, error: str):
        """Log geolocation API error"""
        self.geolocation_logger.error(
            f"\n{'='*80}\n"
            f"GEOLOCATION ERROR\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"Error: {error}\n"
            f"{'='*80}\n"
        )
    
    def log_weather_request(self, latitude: float, longitude: float, url: str):
        """Log weather API request"""
        self.weather_logger.info(
            f"\n{'='*80}\n"
            f"WEATHER REQUEST\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"URL: {url}\n"
            f"{'='*80}"
        )
    
    def log_weather_response(self, latitude: float, longitude: float, response_data: dict, formatted_data: dict = None, status_code: int = 200):
        """Log weather API response"""
        log_message = (
            f"\n{'='*80}\n"
            f"WEATHER RESPONSE\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"Status Code: {status_code}\n"
            f"Raw Response Data:\n{json.dumps(response_data, indent=2, ensure_ascii=False)}\n"
        )
        
        if formatted_data:
            log_message += f"\nFormatted Data:\n{json.dumps(formatted_data, indent=2, ensure_ascii=False)}\n"
        
        log_message += f"{'='*80}\n"
        self.weather_logger.info(log_message)
    
    def log_weather_error(self, latitude: float, longitude: float, error: str):
        """Log weather API error"""
        self.weather_logger.error(
            f"\n{'='*80}\n"
            f"WEATHER ERROR\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"Error: {error}\n"
            f"{'='*80}\n"
        )
    
    def log_forecast_request(self, latitude: float, longitude: float, days: int, url: str):
        """Log forecast API request"""
        self.forecast_logger.info(
            f"\n{'='*80}\n"
            f"FORECAST REQUEST\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"Days: {days}\n"
            f"URL: {url}\n"
            f"{'='*80}"
        )
    
    def log_forecast_response(self, latitude: float, longitude: float, days: int, response_data: dict, formatted_data: dict = None, status_code: int = 200):
        """Log forecast API response"""
        log_message = (
            f"\n{'='*80}\n"
            f"FORECAST RESPONSE\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"Days Requested: {days}\n"
            f"Status Code: {status_code}\n"
            f"Raw Response Data:\n{json.dumps(response_data, indent=2, ensure_ascii=False)}\n"
        )
        
        if formatted_data:
            log_message += f"\nFormatted Data:\n{json.dumps(formatted_data, indent=2, ensure_ascii=False)}\n"
        
        log_message += f"{'='*80}\n"
        self.forecast_logger.info(log_message)
    
    def log_forecast_error(self, latitude: float, longitude: float, days: int, error: str):
        """Log forecast API error"""
        self.forecast_logger.error(
            f"\n{'='*80}\n"
            f"FORECAST ERROR\n"
            f"Coordinates: ({latitude}, {longitude})\n"
            f"Days: {days}\n"
            f"Error: {error}\n"
            f"{'='*80}\n"
        )

# Create singleton instance
api_logger = APILogger()
