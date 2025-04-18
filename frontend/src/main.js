import './styles/main.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'
import L from 'leaflet';
import $ from 'jquery'

import 'leaflet/dist/leaflet.css';
import {app} from "./firebase.js"
import {deleteObject, getBlob, getDownloadURL, getStorage, ref, uploadBytesResumable} from "firebase/storage";
import {addDoc, collection, getFirestore, serverTimestamp, updateDoc} from 'firebase/firestore';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {GeoSearch} from "./GeoSearch.js";
import {AddressAutocomplete} from "./AddressAutocomplete.js";
import {Collapse} from "bootstrap";
import {reverseGeocode} from "./utils/geo.js";
import {getAuth} from "firebase/auth";
import {debounce} from "./utils/debounce.js";
import {setupMediaUpload, uploadedMedia} from "./form/setupMediaUpload.js";


const storage = getStorage(app);
const db = getFirestore(app)
const auth = getAuth(app);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Map setup
const CATANIA_COORDS = [37.5079, 15.0830];
const map = L.map('map').setView(CATANIA_COORDS, 13); // Catania center
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ===== INSERT SNIPPET HERE =====
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      // Popola i campi nascosti
      document.getElementById('lat').value = latitude;
      document.getElementById('lon').value = longitude;
      // Centra la mappa e piazza il marker
      updateMap(latitude, longitude, { center: true });
      // Seleziona automaticamente la modalità “map”
      document.getElementById('modeMap').checked = true;
      Collapse
        .getOrCreateInstance(document.getElementById('collapseMap'), { toggle: false })
        .show();
    },
    err => console.error('Errore geolocazione:', err),
    { enableHighAccuracy: true, timeout: 5000 }
  );
}
// ================================


// Form elements
const addressInput = document.getElementById('street');
const suggestionsBox = document.getElementById('streetSuggestions');

// Initialize auto-complete for street field
const geoSearch = new GeoSearch(map);
new AddressAutocomplete(addressInput, suggestionsBox, geoSearch, ({feature}) => {
    if (feature.properties.postcode) {
        document.getElementById("zipCode").value = feature.properties.postcode
    }

    if (feature.properties.city) {
        document.getElementById("city").value = feature.properties.city
    }

    if (feature.properties.name) {
        document.getElementById("street").value = feature.properties.name
    }

    if (feature.properties.housenumber) {
        document.getElementById("houseNumber").value = feature.properties.name
    }

});

// Initialize auto-complete for search field
const mapSearch = document.getElementById('mapSearch')
const mapSearchSuggestions = document.getElementById('mapSearchSuggestions')
new AddressAutocomplete(mapSearch, mapSearchSuggestions, geoSearch, ({lat, lon}) => {
    updateMap(lat, lon, {center: true})
});

const reportForm = document.getElementById('reportForm');

let selectedAddress = null;
let marker = null;

const modeAddressRadio = document.getElementById('modeAddress');
const modeMapRadio = document.getElementById('modeMap');
const modeGoogleMapsUrlRadio = document.getElementById('modeGoogleMapsUrl');

const addressFields = [$('#city'), $('#houseNumber'), $('#zipCode'), $('#street')]

modeAddressRadio.addEventListener('change', () => {
    if (modeAddressRadio.checked) {
        // Require address fields only if address mode is active
        addressFields.forEach(e => {
            e.prop('required', true)
        })
        $('#collapseMapButton').addClass('collapsed')
        $('#collapseGoogleMapsUrlButton').addClass('collapsed')
        $('#collapseAddressButton').removeClass('collapsed')

        Collapse.getOrCreateInstance(document.getElementById('collapseMap'), {toggle: false}).hide()
        Collapse.getOrCreateInstance(document.getElementById('collapseGoogleMapsUrl'), {toggle: false}).hide()
        Collapse.getOrCreateInstance(document.getElementById('collapseAddress'), {toggle: false}).show()

    }
});

modeMapRadio.addEventListener('change', () => {
    if (modeMapRadio.checked) {
        addressFields.forEach(e => {
            e.prop('required', false)
        })
        $('#collapseMapButton').removeClass('collapsed')
        $('#collapseAddressButton').addClass('collapsed')
        $('#collapseGoogleMapsUrlButton').addClass('collapsed')

        Collapse.getOrCreateInstance(document.getElementById('collapseAddress'), {toggle: false}).hide()
        Collapse.getOrCreateInstance(document.getElementById('collapseGoogleMapsUrl'), {toggle: false}).hide()
        Collapse.getOrCreateInstance(document.getElementById('collapseMap'), {toggle: false}).show()
        map.invalidateSize()
    }
});

modeGoogleMapsUrlRadio.addEventListener('change', () => {
    if (modeGoogleMapsUrlRadio.checked) {
        addressFields.forEach(e => {
            e.prop('required', false)
        })
        $('#collapseGoogleMapsUrlButton').removeClass('collapsed')
        $('#collapseAddressButton').addClass('collapsed')
        $('#collapseMapButton').addClass('collapsed')

        Collapse.getOrCreateInstance(document.getElementById('collapseMap'), {toggle: false}).hide()
        Collapse.getOrCreateInstance(document.getElementById('collapseAddress'), {toggle: false}).hide()
        Collapse.getOrCreateInstance(document.getElementById('collapseGoogleMapsUrl'), {toggle: false}).show()
        map.invalidateSize()
    }
});


$('#headingMap').on('click', function () {
    map.invalidateSize()
})


function updateMap(lat, lon, {center = true} = {}) {
    if (marker) {
        marker.setLatLng([lat, lon]);
        selectedAddress = {lat, lon}
    } else {
        marker = L.marker([lat, lon], {draggable: true}).addTo(map);
        marker.on('dragend', function (e) {
            const pos = e.target.getLatLng();
            selectedAddress = {lat: pos.lat, lon: pos.lng}
            selectedAddress.lat = pos.lat;
            selectedAddress.lon = pos.lng;
        });
    }
    selectedAddress = {lat, lon}
    if (center) {
        map.setView([lat, lon], 16);
    }
}

map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    updateMap(lat, lon, {center: false});
});

// Images and videos
setupMediaUpload(storage)

const severityInput = document.getElementById('severity');
const severityValue = document.getElementById('severityValue');

severityInput.addEventListener('input', () => {
    severityValue.textContent = severityInput.value;
});

let googleMapsCoords = null
const googleMapsInput = document.getElementById('googleMapsUrl')
googleMapsInput.addEventListener('input', debounce(async _ => {
    document.getElementById('googleMapsUrlStatus').classList.remove("invisible")
    const uriValue = googleMapsInput.value // urlencode this
    const encodedUri = encodeURIComponent(uriValue)
    let coordsResult = document.getElementById('googleMapsUrlModeValidationResult');
    let reverseGeoLookupResult = document.getElementById('googleMapsUrlReverseGeoResult');
    try {
        const response = await fetch("/api/decode-google-maps-uri?uri=" + encodedUri)
        if (!response.ok) {
            coordsResult.textContent = await response.text()
            coordsResult.classList.add('text-danger')
            coordsResult.classList.remove('text-success')
            coordsResult.textContent = `URL non valida`
            reverseGeoLookupResult.innerHTML = ''

            if (reportForm.classList.contains("was-validated")) {
                googleMapsInput.setCustomValidity("Invalid URL")
                googleMapsInput.classList.add("is-invalid")
                googleMapsInput.classList.remove("is-valid")
            }
            googleMapsCoords = null
        } else {
            googleMapsInput.setCustomValidity("")
            googleMapsInput.classList.remove("is-invalid")
            googleMapsInput.classList.add("is-valid")

            coordsResult.classList.remove('text-danger')
            googleMapsCoords = await response.json()
            let lat = googleMapsCoords.lat.toFixed(5);
            let lon = googleMapsCoords.lon.toFixed(5);

            let latDir = lat >= 0 ? 'N' : 'S';
            let lonDir = lon >= 0 ? 'E' : 'W';

            let textContent = `Coordinate rilevate: ${Math.abs(lat)}° ${latDir}, ${Math.abs(lon)}° ${lonDir}`;

            coordsResult.innerHTML = `<span class="badge d-inline-flex p-2 align-items-center text-bg-primary rounded-pill mb-1">
                                            <i class="bi bi-geo-alt"></i>
                                            <span class="px-1">${textContent}</span>
                                        </span>`

            let address = await reverseGeocode(googleMapsCoords.lat, googleMapsCoords.lon);
            reverseGeoLookupResult.innerHTML = `<span class="badge d-inline-flex p-2 align-items-center text-bg-secondary rounded-pill">
                                            <i class="bi bi-house"></i>
                                            <span class="px-1">${address}</span>
                                        </span>`
        }

    } catch (err) {
        googleMapsInput.setCustomValidity("Invalid URL")
        googleMapsInput.classList.add("is-invalid")
        googleMapsInput.classList.remove("is-valid")
        coordsResult.classList.add('text-danger')
        coordsResult.classList.remove('text-success')
        coordsResult.textContent = `URL non valida`
        googleMapsCoords = null
    }
    document.getElementById('googleMapsUrlStatus').classList.add("invisible")
}, 300))

// Form submit
reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = false
    if (reportForm.checkValidity()) {
        isValid |= true
    }

    if (modeMapRadio.checked) {
        if (!selectedAddress) {
            $('#mapModeValidationResult')
                .removeClass('visually-hidden')
                .addClass('alert-danger')
                .text('Selezionare una posizione sulla mappa')
        } else {
            $('#mapModeValidationResult')
                .removeClass('alert-danger')
                .addClass('visually-hidden')
                .text('')
            isValid |= true
        }
    }

    if (modeGoogleMapsUrlRadio.checked) {
        /**
         *
         * @type {HTMLInputElement}
         */
        let googleMapsUrlInput = document.getElementById("googleMapsUrl");
        if (googleMapsCoords == null) {
            googleMapsUrlInput.setCustomValidity("Invalid URL");
            googleMapsUrlInput.classList.add("is-invalid")
            googleMapsUrlInput.classList.remove("is-valid")
        } else {
            googleMapsUrlInput.setCustomValidity("");
            googleMapsUrlInput.classList.add("is-valid")
            googleMapsUrlInput.classList.remove("is-invalid")
        }
    }


    reportForm.classList.add('was-validated')

    if (isValid) {
        // Proceed with saving to Firestore...
        await submitReport()
        // Redirect to thank you page
        window.location.href = 'thankyou.html';
    }
});


async function submitReport() {
    const locationMode = document.querySelector('input[name="locationMode"]:checked').value;

    const summary = document.getElementById('summary').value.trim();
    const category = document.getElementById('category').value.trim();
    const description = document.getElementById('description').value.trim();
    const severity = parseInt(document.getElementById('severity').value, 10);

    const reportData = {
        summary,
        category,
        description,
        severity,
        created_at: serverTimestamp(),
    };

    if (locationMode === 'address') {
        reportData.location_mode = 'address';
        reportData.address = document.getElementById('street').value.trim();
        reportData.house_number = document.getElementById('houseNumber').value.trim();
        reportData.city = document.getElementById('city').value.trim();
        reportData.zip_code = document.getElementById('zipCode').value.trim();

    } else if (locationMode === 'map') {
        const lat = selectedAddress.lat
        const lon = selectedAddress.lon

        reportData.location_mode = 'map';
        reportData.coordinates = {lat, lon};

        reportData.address = await reverseGeocode(lat, lon);
    } else if (locationMode === 'googleMapsUrl') {
        const lat = googleMapsCoords.lat
        const lon = googleMapsCoords.lon

        reportData.location_mode = 'googleMapsUrl';
        reportData.coordinates = {lat, lon};

        reportData.address = await reverseGeocode(lat, lon);
    }

    const docRef = await addDoc(collection(db, 'reports'),
        {
            ...reportData,
            user_id: auth.currentUser.uid
        });

    const finalMediaUrls = [];
    for (const media of uploadedMedia) {
        const newUrl = await moveFile(media.storagePath, docRef.id);
        finalMediaUrls.push(newUrl);
    }

// Update Firestore doc:
    await updateDoc(docRef, {media: finalMediaUrls});
}

export async function moveFile(storagePath, reportId) {
    const oldRef = ref(storage, storagePath);
    const filename = storagePath.split('/').pop();
    const newRef = ref(storage, `uploads/reports/${reportId}/${filename}`);

    const blob = await getBlob(oldRef); // No CORS problem!
    await uploadBytesResumable(newRef, blob);
    await deleteObject(oldRef);

    return await getDownloadURL(newRef);
}


