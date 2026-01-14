# Geographic Center Calculator

A web app that calculates the geographic center (centroid) of multiple locations using spherical geometry. Features both a flat map and an interactive 3D globe view.

## Features

- **Interactive Map** - Click anywhere to add location markers
- **Location Search** - Search for places by name using OpenStreetMap geocoding
- **Drag & Drop** - Drag markers to reposition them; lines and center update in real-time
- **Delete Points** - Remove points via the × button in the list or the Delete link in popups
- **Geographic Center** - Calculates the true spherical centroid (red marker)
- **Connecting Lines** - Visual lines from each point to the center
- **Coordinates Panel** - Live list of all coordinates with lat/long; hover to highlight pins
- **3D Globe View** - Toggle to an interactive WebGL globe with the same points and arcs
- **Share URL** - Copy a shareable link with all points encoded in the URL
- **URL Parameters** - Load points directly from URL for bookmarking and sharing

## Usage

1. Open `index.html` in a browser (or serve via `python3 -m http.server`)
2. Search for a location or click on the map to add points
3. Drag markers to adjust positions
4. Watch the center point update automatically
5. Click "Switch to Globe" for 3D visualization
6. Click × next to a coordinate or "Delete" in a popup to remove points
7. Click "Copy URL" or "Copy Short URL" to get a shareable link
8. Click "Clear All" to start over

## Controls

| Action | How |
|--------|-----|
| Add point | Click on map/globe, or search and select |
| Move point | Drag the marker (map view only) |
| Delete point | Click × in coordinate list, or "Delete" in popup |
| Highlight pin | Hover over a location in the coordinate list |
| Toggle view | Click "Switch to Globe/Map" button |
| Share map | Click "Copy URL" (full) or "Copy Short URL" (compact) |
| Clear all | Click "Clear All" button |

## URL Parameters

Two URL formats are supported:

### Full Format (`?pts=`)
Preserves location names, human-readable coordinates:
```
?pts=lat1,lng1;lat2,lng2
?pts=lat1,lng1,Name1;lat2,lng2,Name2
```

**Examples:**
```
?pts=40.7128,-74.0060;34.0522,-118.2437
?pts=40.7128,-74.0060,New%20York;34.0522,-118.2437,Los%20Angeles
```

### Short Format (`?geo=`)
Compact geohash encoding (~50% shorter), no names:
```
?geo=dr5regw3p9q5ctr18
```

Each location is encoded as a 9-character geohash (~5m precision), concatenated together.

| Format | NYC + LA Example | Length |
|--------|------------------|--------|
| Full | `?pts=40.7128,-74.0060,New%20York;34.0522,-118.2437,Los%20Angeles` | 75 chars |
| Short | `?geo=dr5regw3p9q5ctr18` | 22 chars |

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
