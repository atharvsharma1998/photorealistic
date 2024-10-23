import os
import requests
from math import floor, log, tan, pi, cos

# Constants
TILE_SIZE = 256
SESSION_URL = "https://tile.googleapis.com/v1/createSession?key=YOUR_API_KEY"
TILE_URL_TEMPLATE = "https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session={session_token}&key=YOUR_API_KEY"

# Function to calculate tile X and Y from latitude and longitude
def lat_long_to_tile(lat, lon, zoom):
    lat_rad = lat * pi / 180.0
    n = 2.0 ** zoom
    x_tile = floor((lon + 180.0) / 360.0 * n)
    y_tile = floor((1.0 - log(tan(lat_rad) + (1 / cos(lat_rad))) / pi) / 2.0 * n)
    print(x_tile, y_tile)
    return x_tile, y_tile

# Function to download tile image
def download_tile(session_token, zoom, x, y, output_dir):
    url = TILE_URL_TEMPLATE.format(z=zoom, x=x, y=y, session_token=session_token)
    response = requests.get(url, stream=True)
    print(response)
    if response.status_code == 200:
        filename = os.path.join(output_dir, f"tile_{zoom}_{x}_{y}.jpeg")
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        print(f"Downloaded: {filename}")
        return filename
    else:
        print(f"Failed to download tile {x}, {y} at zoom {zoom}")
        return None

# Main script
def main(lat, lon, zoom, api_key):
    # Create a session
    session_payload = {
        "mapType": "satellite",
        "language": "en-US",
        "region": "US"
    }
    headers = {'Content-Type': 'application/json'}
    response = requests.post(SESSION_URL.replace("YOUR_API_KEY", api_key), json=session_payload, headers=headers)
    print(response)
    if response.status_code == 200:
        session_data = response.json()
        session_token = session_data["session"]
        print(f"Session created: {session_token}")
    else:
        print("Failed to create session.")
        return

    # Calculate tile coordinates
    x_tile, y_tile = lat_long_to_tile(lat, lon, zoom)
    output_dir = "tiles"
    os.makedirs(output_dir, exist_ok=True)

    # Download single tile
    download_tile(session_token, zoom, x_tile, y_tile, output_dir)

if __name__ == "__main__":
    latitude = float(input("Enter latitude: "))
    longitude = float(input("Enter longitude: "))
    zoom_level = int(input("Enter zoom level (e.g., 16): "))
    google_api_key = input("Enter your Google API key: ")

    main(latitude, longitude, zoom_level, google_api_key)
