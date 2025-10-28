# SMS Weather Integration

This app includes SMS-based weather functionality for offline use on Android devices.

## How it works

1. **Offline Detection**: When the app detects no internet connection, it offers SMS as an alternative
2. **SMS Request**: User can send weather requests via SMS to a server number
3. **Server Response**: Server responds with weather data tagged as `[WEATHER]`
4. **SMS Receiver**: Android SMS receiver captures the response and stores it
5. **App Integration**: React Native app reads the stored SMS data and displays weather

## SMS Message Format

### Request Format
```
[WEATHER_REQUEST] latitude,longitude
```
Example: `[WEATHER_REQUEST] 12.971599,77.594566`

### Response Format
```
[WEATHER] Temperature: 28°C, Condition: Sunny, Humidity: 65%, Wind: 5 km/h
```

## Android Setup

1. **Permissions**: The app requests SMS permissions when needed
2. **SMS Receiver**: Automatically processes incoming weather SMS
3. **Data Storage**: Weather data is stored in SharedPreferences and files

## Usage

1. Go offline (disable internet)
2. Open the app - it will detect offline mode
3. When prompted, choose "Send SMS" to request weather
4. SMS app opens with pre-filled message
5. Send the SMS
6. Wait for server response (may take time)
7. Weather data appears in the app

## Server Requirements

The SMS server should:
- Listen for messages starting with `[WEATHER_REQUEST]`
- Extract coordinates from the message
- Fetch weather data for those coordinates
- Respond with formatted weather data using `[WEATHER]` tag

## Testing

To test SMS functionality:
1. Use Android emulator or physical device
2. Send SMS manually to test the receiver
3. Check logs for SMS processing
4. Verify data storage and retrieval