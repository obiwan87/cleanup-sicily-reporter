import { getClampedBounds } from './utils/geo.js';

export class GeoSearch {
    constructor(map, { minBBoxSizeMeters = 20000 } = {}) {
        this.map = map;
        this.minBBoxSizeMeters = minBBoxSizeMeters;

        this.sicilyBounds = L.latLngBounds(
            [36.370, 12.228],
            [38.290, 15.652]
        );
    }

    async search(query, limit = 5, lang = 'en') {
        if (query.length < 3) return [];

        const mapBounds = this.map.getBounds();
        let searchBounds = getClampedBounds(this.sicilyBounds, mapBounds);

        if (!searchBounds) {
            searchBounds = this.sicilyBounds; // fallback
        }

        if (this._bboxTooSmall(searchBounds)) {
            searchBounds = this._expandBBox(searchBounds, this.minBBoxSizeMeters);
        }

        const bboxParam = [
            searchBounds.getWest(),
            searchBounds.getSouth(),
            searchBounds.getEast(),
            searchBounds.getNorth()
        ].join(',');

        const response = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}&lang=${lang}&bbox=${bboxParam}`
        );

        const data = await response.json();
        return data.features || [];
    }

    _bboxTooSmall(bounds) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        const width = sw.distanceTo(L.latLng(sw.lat, ne.lng));
        const height = sw.distanceTo(L.latLng(ne.lat, sw.lng));

        return width < this.minBBoxSizeMeters || height < this.minBBoxSizeMeters;
    }

    _expandBBox(bounds, targetSizeMeters) {
        const center = bounds.getCenter();
        const deltaLat = this._metersToLat(targetSizeMeters / 2);
        const deltaLon = this._metersToLon(targetSizeMeters / 2, center.lat);

        const expandedBounds = L.latLngBounds(
            [center.lat - deltaLat, center.lng - deltaLon],
            [center.lat + deltaLat, center.lng + deltaLon]
        );

        return getClampedBounds(this.sicilyBounds, expandedBounds) || this.sicilyBounds;
    }

    _metersToLat(meters) {
        return meters / 111320;
    }

    _metersToLon(meters, lat) {
        return meters / (111320 * Math.cos(lat * Math.PI / 180));
    }
}
