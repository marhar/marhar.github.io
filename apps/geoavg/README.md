# Geographic Center Calculator

A web app that calculates the geographic center (centroid) of multiple locations using spherical geometry. Features both a flat map and an interactive 3D globe view.

## Features

- **Interactive Map** - Click anywhere to add location markers
- **Location Search** - Search for places by name using OpenStreetMap geocoding
- **Drag & Drop** - Drag markers to reposition them; lines and center update in real-time
- **Delete Points** - Remove points via the × button in the list or the Delete link in popups
- **Geographic Center** - Calculates the true spherical centroid (red marker)
- **Connecting Lines** - Visual lines from each point to the center
- **Coordinates Panel** - Live list of all coordinates with lat/long
- **3D Globe View** - Toggle to an interactive WebGL globe with the same points and arcs

## Usage

1. Open `index.html` in a browser (or serve via `python3 -m http.server`)
2. Search for a location or click on the map to add points
3. Drag markers to adjust positions
4. Watch the center point update automatically
5. Click "Switch to Globe" for 3D visualization
6. Click × next to a coordinate or "Delete" in a popup to remove points
7. Click "Clear All" to start over

## Controls

| Action | How |
|--------|-----|
| Add point | Click on map/globe, or search and select |
| Move point | Drag the marker (map view only) |
| Delete point | Click × in coordinate list, or "Delete" in popup |
| Toggle view | Click "Switch to Globe/Map" button |
| Clear all | Click "Clear All" button |

## How Center Calculation Works

The geographic center uses **spherical averaging** for accuracy across any distance:

1. Convert each lat/lng to 3D Cartesian coordinates (x, y, z) on a unit sphere
2. Average all x, y, z components
3. Convert the averaged vector back to lat/lng

This accounts for Earth's curvature and works correctly whether points are nearby or spread across continents—unlike simple coordinate averaging which fails at large scales.

## Tech Stack

- **[Leaflet.js](https://leafletjs.com/)** - Interactive 2D maps
- **[Globe.gl](https://globe.gl/)** - WebGL 3D globe visualization
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Map tiles
- **[Nominatim](https://nominatim.org/)** - Geocoding API for location search
- No API keys required
- Single HTML file, no build step

## Running Locally

```bash
# Option 1: Open directly (search may not work due to CORS)
open index.html

# Option 2: Serve with Python (recommended)
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires WebGL for globe view.
