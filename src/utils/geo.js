import L from 'leaflet';

/**
 * Returns a new LatLngBounds representing the intersection
 * of boundsA and boundsB.
 * If they do not intersect, returns null.
 */
export function getClampedBounds(boundsA, boundsB) {
    if (!boundsA.intersects(boundsB)) {
        return null;
    }

    const sw = L.latLng(
        Math.max(boundsA.getSouth(), boundsB.getSouth()),
        Math.max(boundsA.getWest(), boundsB.getWest())
    );

    const ne = L.latLng(
        Math.min(boundsA.getNorth(), boundsB.getNorth()),
        Math.min(boundsA.getEast(), boundsB.getEast())
    );

    return L.latLngBounds(sw, ne);
}

export async function reverseGeocode(lat, lon) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();

    return data.display_name || 'Posizione selezionata sulla mappa';
}
