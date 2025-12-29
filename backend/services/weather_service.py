import requests
from typing import Dict, Any, Optional

class WeatherService:
    """
    Service to interact with Open-Meteo API for weather data.
    Does not require an API key.
    """
    
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    
    # Default to Prague if no location provided (approximate coords)
    DEFAULT_LAT = 50.0755
    DEFAULT_LON = 14.4378
    
    def get_forecast(self, lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> str:
        """
        Fetches a simple weather forecast for the next 24 hours.
        Returns a human-readable summary string.
        """
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max"],
                "current": ["temperature_2m", "weather_code"],
                "timezone": "auto",
                "forecast_days": 2
            }
            
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Parse current weather
            current = data.get("current", {})
            curr_temp = current.get("temperature_2m", "N/A")
            
            # Parse daily forecast (today and tomorrow)
            daily = data.get("daily", {})
            today_max = daily.get("temperature_2m_max", [])[0] if daily.get("temperature_2m_max") else "N/A"
            today_min = daily.get("temperature_2m_min", [])[0] if daily.get("temperature_2m_min") else "N/A"
            weather_code = daily.get("weather_code", [])[0] if daily.get("weather_code") else 0
            
            condition = self._get_wmo_description(weather_code)
            
            summary = (
                f"**Current Weather:** {curr_temp}°C\n"
                f"**Today's Forecast:** {condition}. High: {today_max}°C, Low: {today_min}°C\n"
            )
            return summary
            
        except Exception as e:
            return f"Error fetching weather data: {str(e)}"

    def _get_wmo_description(self, code: int) -> str:
        """Helper to convert WMO weather codes to text."""
        # Simplified WMO code mapping
        if code == 0: return "Clear sky"
        if code in [1, 2, 3]: return "Mainly clear, partly cloudy, and overcast"
        if code in [45, 48]: return "Fog"
        if code in [51, 53, 55]: return "Drizzle"
        if code in [61, 63, 65]: return "Rain"
        if code in [71, 73, 75]: return "Snow fall"
        if code in [95, 96, 99]: return "Thunderstorm"
        return "Unknown"
