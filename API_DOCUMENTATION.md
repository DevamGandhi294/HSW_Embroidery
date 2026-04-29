# HSW Machine Monitor - API Documentation

## Overview

This document describes the API endpoint for sending sensor data from your embroidery machine hardware device to the HSW Machine Monitor dashboard.

## API Endpoint

**URL:** `https://fbqbzhbukznradmsqtxg.supabase.co/functions/v1/ingest-sensor-data`

**Method:** `POST`

**Content-Type:** `application/json`

**Authentication:** Public endpoint (no authentication required)

## Request Format

### Required Fields

- `device_id` (string): Unique identifier for the machine hardware device

### Optional Fields

All sensor readings are optional. Include only the sensors that are available on your device:

- `firmware_version` (string): Current firmware version of the device
- `timestamp` (string): ISO 8601 timestamp of when the data was collected (defaults to current time if not provided)
- `frequency` (string): Update frequency from device
- **Surface Level Parameters:**
  - `pitch` (integer): Surface level pitch angle measurement
  - `roll` (integer): Surface level roll angle measurement
  - `surface_x` (integer): X-axis surface level component
  - `surface_y` (integer): Y-axis surface level component
  - `surface_z` (integer): Z-axis surface level component
- **Vibration Parameters:**
  - `vibration` (number): Hz or G measurement
  - `vib_magnitude` (number): Vibration magnitude measurement
  - `vibration_x` (number): X-axis vibration component
  - `vibration_y` (number): Y-axis vibration component
  - `vibration_z` (number): Z-axis vibration component
- `temp_1` to `temp_8` (number): Temperature sensor readings for 8 different areas
- `main_motor_encoder` (number): Main motor encoder value
- `color_motor_encoder` (number): Color changing motor encoder value
- `x_motor_encoder` (number): X-axis motor encoder value (open cover and install encoder)
- `y_motor_encoder` (number): Y-axis motor encoder value
- `trimming_back_sensor` (number): Trimming back sensor data (yellow one)
- `x_motor_direction` (string): X-axis motor direction - valid values: 'right', 'left', 'idle', 'sensor fail'
- `x_position` (string): X-axis position status - valid values: 'at_a', 'at_b', 'between', 'unknown'
- `y_motor_direction` (string): Y-axis motor direction - valid values: 'right', 'left', 'idle', 'sensor fail'
- `y_position` (string): Y-axis position status - valid values: 'at_a', 'at_b', 'between', 'unknown'
- `buffer_1` (string): First customizable buffer parameter (any string value)
- `buffer_2` (string): Second customizable buffer parameter (any string value)
- `buffer_3` (string): Third customizable buffer parameter (any string value)
- `buffer_4` (string): Fourth customizable buffer parameter (any string value)
- `buffer_5` (string): Fifth customizable buffer parameter (any string value)

### Example Request

```json
{
  "device_id": "HSW-001",
  "firmware_version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "frequency": "5",
  "pitch": 15,
  "roll": -8,
  "surface_x": 12,
  "surface_y": 18,
  "surface_z": 22,
  "vibration": 2.5,
  "vib_magnitude": 1.029,
  "vibration_x": 45,
  "vibration_y": 38,
  "vibration_z": 52,
  "temp_1": 35.2,
  "temp_2": 38.5,
  "temp_3": 42.1,
  "temp_4": 36.8,
  "temp_5": 39.0,
  "temp_6": 37.5,
  "temp_7": 40.2,
  "temp_8": 38.9,
  "main_motor_encoder": 12345,
  "color_motor_encoder": 6789,
  "x_motor_encoder": 4321,
  "y_motor_encoder": 8765,
  "trimming_back_sensor": 1,
  "x_motor_direction": "right",
  "x_position": "at_b",
  "y_motor_direction": "left",
  "y_position": "between",
  "buffer_1": "Custom data 1",
  "buffer_2": "Status OK",
  "buffer_3": "Process running",
  "buffer_4": "Queue: 5",
  "buffer_5": "Stitch count: 1523"
}
```

### cURL Example (Single Request)

```bash
curl -X POST https://fbqbzhbukznradmsqtxg.supabase.co/functions/v1/ingest-sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "HSW-001",
    "firmware_version": "1.0.0",
    "pitch": 15,
    "roll": -8,
    "surface_x": 12,
    "surface_y": 18,
    "surface_z": 22,
    "vibration": 2.5,
    "vibration_x": 45,
    "vibration_y": 38,
    "vibration_z": 52,
    "temp_1": 35.2,
    "temp_2": 38.5,
    "temp_3": 42.1,
    "temp_4": 36.8,
    "temp_5": 39.0,
    "temp_6": 37.5,
    "temp_7": 40.2,
    "temp_8": 38.9,
    "main_motor_encoder": 12345,
    "color_motor_encoder": 6789,
    "x_motor_encoder": 4321,
    "y_motor_encoder": 8765,
    "trimming_back_sensor": 1,
    "x_motor_direction": "right",
    "y_motor_direction": "left",
    "buffer_1": "Custom data 1",
    "buffer_2": "Status OK",
    "buffer_3": "Process running",
    "buffer_4": "Queue: 5",
    "buffer_5": "Stitch count: 1523"
  }'
```

### cURL Example (Loop with Frequency)

This example shows how to send data continuously at the frequency specified by the API response:

```bash
#!/bin/bash

# Initial request to get update frequency
RESPONSE=$(curl -s -X POST https://fbqbzhbukznradmsqtxg.supabase.co/functions/v1/ingest-sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "HSW-001",
    "firmware_version": "1.0.0",
    "pitch": 15,
    "roll": -8,
    "surface_x": 12,
    "surface_y": 18,
    "surface_z": 22,
    "vibration": 2.5,
    "vibration_x": 45,
    "vibration_y": 38,
    "vibration_z": 52,
    "temp_1": 35.2
  }')

# Extract update frequency from response (default to 5 seconds if not found)
FREQUENCY=$(echo $RESPONSE | grep -o '"update_frequency_seconds":[0-9]*' | grep -o '[0-9]*')
FREQUENCY=${FREQUENCY:-5}

echo "Sending data every $FREQUENCY seconds..."

# Continuous loop
while true; do
  curl -X POST https://fbqbzhbukznradmsqtxg.supabase.co/functions/v1/ingest-sensor-data \
    -H "Content-Type: application/json" \
    -d '{
      "device_id": "HSW-001",
      "firmware_version": "1.0.0",
      "pitch": 15,
      "roll": -8,
      "vibration": 2.5,
      "vibration_x": 45,
      "vibration_y": 38,
      "vibration_z": 52,
      "temp_1": 35.2,
      "temp_2": 38.5,
      "temp_3": 42.1,
      "temp_4": 36.8,
      "x_motor_encoder": 4321,
      "y_motor_encoder": 8765,
      "x_motor_direction": "right",
      "y_motor_direction": "left"
    }'

  sleep $FREQUENCY
done
```

### Python Example

```python
import requests
import json
from datetime import datetime

url = "https://fbqbzhbukznradmsqtxg.supabase.co/functions/v1/ingest-sensor-data"

payload = {
    "device_id": "HSW-001",
    "firmware_version": "1.0.0",
    "timestamp": datetime.now().isoformat(),
    "pitch": 15,
    "roll": -8,
    "surface_x": 12,
    "surface_y": 18,
    "surface_z": 22,
    "vibration": 2.5,
    "vibration_x": 45,
    "vibration_y": 38,
    "vibration_z": 52,
    "temp_1": 35.2,
    "temp_2": 38.5,
    "temp_3": 42.1,
    "temp_4": 36.8,
    "temp_5": 39.0,
    "temp_6": 37.5,
    "temp_7": 40.2,
    "temp_8": 38.9,
    "main_motor_encoder": 12345,
    "color_motor_encoder": 6789,
    "x_motor_encoder": 4321,
    "y_motor_encoder": 8765,
    "trimming_back_sensor": 1,
    "x_motor_direction": "right",
    "y_motor_direction": "left",
    "buffer_1": "Custom data 1",
    "buffer_2": "Status OK",
    "buffer_3": "Process running",
    "buffer_4": "Queue: 5",
    "buffer_5": "Stitch count: 1523"
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### Arduino/ESP32 Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* apiUrl = "https://fbqbzhbukznradmsqtxg.supabase.co/functions/v1/ingest-sensor-data";
const char* deviceId = "HSW-001";
const char* firmwareVersion = "1.0.0";

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<512> doc;
    doc["device_id"] = deviceId;
    doc["firmware_version"] = firmwareVersion;
    doc["surface_level"] = readSurfaceLevel();
    doc["vibration"] = readVibration();
    doc["temp_1"] = readTemp1();
    // Add other sensor readings...

    String jsonString;
    serializeJson(doc, jsonString);

    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error: " + String(httpResponseCode));
    }

    http.end();
  }
}
```

## Response Format

### Success Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Sensor data received successfully",
  "machine_id": "uuid-of-machine",
  "latest_firmware_version": "1.0.0",
  "update_frequency_seconds": 5
}
```

**Response Fields:**
- `success` (boolean): Indicates if the request was successful
- `message` (string): Success message
- `machine_id` (string): UUID of the machine in the database
- `latest_firmware_version` (string): Latest firmware version available (if newer than current)
- `update_frequency_seconds` (number): How often the device should send data (in seconds)

### Error Responses

**Status Code:** `400 Bad Request`

```json
{
  "error": "device_id is required"
}
```

**Status Code:** `405 Method Not Allowed`

```json
{
  "error": "Method not allowed"
}
```

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Internal server error",
  "details": "Error message details"
}
```

## Automatic Machine Registration

When you send data for a new `device_id`:
1. A new machine is automatically created in the database
2. Default sensor configurations are initialized with standard names
3. The machine name will be set to "Machine {device_id}"
4. You can customize the machine name and sensor names from the dashboard

## Motor Direction Parameters

The API supports tracking motor direction for X and Y axes:
- Valid values: `'right'`, `'left'`, `'sensor fail'`
- These appear in a dedicated "Motor Directions" section on the dashboard
- Visual indicators show the direction with arrows or alerts for sensor failures

## Buffer Parameters

Five customizable buffer parameters (`buffer_1` through `buffer_5`) are available:
- Accept any string value for flexible data storage
- Can be named independently through the dashboard interface
- Useful for custom status messages, counters, or device-specific data
- Only displayed on dashboard when values are present

## Data Update Frequency

- The API returns `update_frequency_seconds` in every response
- Your device should use this value to determine how often to send data
- Default frequency is 5 seconds, but can be configured per-machine in the dashboard
- The frequency can be adjusted by administrators through the Device Configuration page
- Machines are marked offline if no data received within 3x the update frequency period

## Dashboard Features

The dashboard provides a comprehensive monitoring and configuration system:

### Machine Overview (Main Dashboard)
- **Machine List**: View all registered machines in one place
- **Online/Offline Status**: Real-time status with "offline since" timestamp
- **Issue Detection**: Automatic alerts showing number of active sensor threshold violations
- **Quick Actions**: View Data and Configuration buttons for each machine

### Machine Data View
- **Current Data Tab**: Real-time sensor readings with visual indicators
- **Historical Data Tab**: Tabular view of past sensor readings (last 100 records)
- **CSV Export**: Download historical data for analysis
- **Motor Directions**: Visual display of X and Y motor directions
- **Buffer Parameters**: Display of custom buffer values when present

### Device Configuration Page
- **Password Protection**: Manufacturing password required for changes
- **General Settings**:
  - Machine name configuration
  - Firmware version display (read-only)
  - Update frequency configuration (seconds)
- **Sensor Configuration**:
  - Enable/disable individual sensors
  - Customize display names and units
  - Set min/max threshold alerts
- **Buffer Parameters**:
  - Custom naming for all 5 buffer parameters
  - Description fields for documentation

### Real-time Updates
- Automatic dashboard refresh every 10 seconds
- Live updates when new data arrives
- Instant status changes reflected across all views

## Troubleshooting

### Data Not Appearing in Dashboard

1. Verify the `device_id` is consistent across requests
2. Check that the API endpoint URL is correct
3. Ensure your device has internet connectivity
4. Verify the JSON payload is properly formatted
5. Check the API response for error messages

### Sensors Not Showing Up

- Sensors will only appear after the first data point is sent
- Make sure you're sending at least one sensor value in your payload
- Refresh the dashboard after sending data

### Connection Issues

- Ensure your firewall allows HTTPS connections to supabase.co
- Check that your device can resolve DNS for the API endpoint
- Verify SSL/TLS certificates are up to date on your device
