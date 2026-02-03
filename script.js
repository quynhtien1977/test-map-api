// ===========================
// Global Variables
// ===========================
let map;
let markers = [];
let currentLayer;

// Map tile layers
const tileLayers = {
    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }),
    humanitarian: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team',
        maxZoom: 19
    }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap',
        maxZoom: 17
    }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 19
    })
};

// ===========================
// Initialize Map
// ===========================
function initMap() {
    // Default location (Jakarta, Indonesia)
    const defaultLocation = [-6.2088, 106.8456];

    // Create map
    map = L.map('map', {
        center: defaultLocation,
        zoom: 10,
        zoomControl: false // We'll use custom controls
    });

    // Add default tile layer
    currentLayer = tileLayers.standard;
    currentLayer.addTo(map);

    // Force map to recalculate size (fixes rendering issues)
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    // Add click listener to map
    map.on('click', (e) => {
        addMarker(e.latlng);
    });

    // Add zoom change listener
    map.on('zoomend', () => {
        updateZoomLevel();
    });

    // Initialize event listeners
    initEventListeners();

    // Update initial zoom level display
    updateZoomLevel();

    console.log('Map initialized successfully with OpenStreetMap!');
}

// ===========================
// Event Listeners
// ===========================
function initEventListeners() {
    // Search button
    document.getElementById('searchBtn').addEventListener('click', searchLocation);

    // Search on Enter key
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });

    // Current location button
    document.getElementById('currentLocationBtn').addEventListener('click', getCurrentLocation);

    // Clear markers button
    document.getElementById('clearMarkersBtn').addEventListener('click', clearMarkers);

    // Zoom buttons
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        map.setZoom(map.getZoom() + 1);
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        map.setZoom(map.getZoom() - 1);
    });

    // Map type selector
    document.getElementById('mapType').addEventListener('change', (e) => {
        changeMapStyle(e.target.value);
    });
}

// ===========================
// Change Map Style
// ===========================
function changeMapStyle(style) {
    // Remove current layer
    map.removeLayer(currentLayer);

    // Add new layer
    currentLayer = tileLayers[style];
    currentLayer.addTo(map);

    console.log('Map style changed to:', style);
}

// ===========================
// Search Location (using Nominatim)
// ===========================
async function searchLocation() {
    const searchInput = document.getElementById('searchInput').value;

    if (!searchInput.trim()) {
        alert('Please enter a location to search');
        return;
    }

    try {
        // Use Nominatim API for geocoding (free, no API key needed)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&limit=1`
        );

        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const location = [parseFloat(result.lat), parseFloat(result.lon)];

            // Center map on location
            map.setView(location, 15);

            // Add marker at searched location
            addMarker({ lat: location[0], lng: location[1] }, result.display_name);

            console.log('Location found:', result.display_name);
        } else {
            alert('Location not found. Please try a different search term.');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('Error searching for location. Please try again.');
    }
}

// ===========================
// Add Marker
// ===========================
function addMarker(location, title = null) {
    const lat = location.lat;
    const lng = location.lng;

    // Create marker
    const marker = L.marker([lat, lng], {
        title: title || `Marker ${markers.length + 1}`
    }).addTo(map);

    // Create popup content
    const popupContent = `
        <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">${title || 'Custom Marker'}</h3>
            <p style="margin: 5px 0; color: #475569; font-size: 12px;">
                <strong>Latitude:</strong> ${lat.toFixed(6)}<br>
                <strong>Longitude:</strong> ${lng.toFixed(6)}
            </p>
            <button onclick="removeMarkerByIndex(${markers.length})" 
                style="margin-top: 10px; padding: 6px 12px; background: #ef4444; color: white; 
                border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">
                Remove Marker
            </button>
        </div>
    `;

    marker.bindPopup(popupContent);

    // If no title provided, get address from reverse geocoding
    if (!title) {
        reverseGeocode(lat, lng, marker);
    }

    markers.push(marker);
    updateMarkerCount();

    console.log('Marker added at:', lat, lng);
}

// ===========================
// Reverse Geocoding
// ===========================
async function reverseGeocode(lat, lng, marker) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        const data = await response.json();

        if (data && data.display_name) {
            // Update marker popup with address
            const popupContent = `
                <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">${data.display_name}</h3>
                    <p style="margin: 5px 0; color: #475569; font-size: 12px;">
                        <strong>Latitude:</strong> ${lat.toFixed(6)}<br>
                        <strong>Longitude:</strong> ${lng.toFixed(6)}
                    </p>
                    <button onclick="removeMarkerByIndex(${markers.indexOf(marker)})" 
                        style="margin-top: 10px; padding: 6px 12px; background: #ef4444; color: white; 
                        border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">
                        Remove Marker
                    </button>
                </div>
            `;
            marker.setPopupContent(popupContent);
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
    }
}

// ===========================
// Remove Marker
// ===========================
function removeMarkerByIndex(index) {
    if (markers[index]) {
        map.removeLayer(markers[index]);
        markers.splice(index, 1);
        updateMarkerCount();
        console.log('Marker removed');
    }
}

// Make function globally accessible
window.removeMarkerByIndex = removeMarkerByIndex;

// ===========================
// Clear All Markers
// ===========================
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    updateMarkerCount();
    console.log('All markers cleared');
}

// ===========================
// Get Current Location
// ===========================
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                map.setView([lat, lng], 15);
                addMarker({ lat, lng }, 'Your Current Location');

                console.log('Current location found:', lat, lng);
            },
            (error) => {
                handleLocationError(true, error);
            }
        );
    } else {
        handleLocationError(false);
    }
}

// ===========================
// Handle Location Error
// ===========================
function handleLocationError(browserHasGeolocation, error = null) {
    let errorMessage = browserHasGeolocation
        ? 'Error: The Geolocation service failed.'
        : 'Error: Your browser doesn\'t support geolocation.';

    if (error) {
        errorMessage += '\n' + error.message;
    }

    alert(errorMessage);
    console.error(errorMessage);
}

// ===========================
// Update UI Elements
// ===========================
function updateMarkerCount() {
    document.getElementById('markerCount').textContent = markers.length;
}

function updateZoomLevel() {
    document.getElementById('zoomLevel').textContent = map.getZoom();
}

// ===========================
// Initialize on Load
// ===========================
window.addEventListener('load', () => {
    initMap();
});
