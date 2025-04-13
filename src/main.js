import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'
import L from 'leaflet';
import $ from 'jquery'

import 'leaflet/dist/leaflet.css';
import {app} from "./firebase.js"
import {deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable, getBlob} from "firebase/storage";
import {addDoc, collection, getFirestore, serverTimestamp, updateDoc} from 'firebase/firestore';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {GeoSearch} from "./GeoSearch.js";
import {AddressAutocomplete} from "./AddressAutocomplete.js";
import {Collapse} from "bootstrap";
import {reverseGeocode} from "./utils/geo.js";


const storage = getStorage(app);
const db = getFirestore(app)

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

const addressFields = [$('#city'), $('#houseNumber'), $('#zipCode'), $('#street')]

modeAddressRadio.addEventListener('change', () => {
    if (modeAddressRadio.checked) {
        // Require address fields only if address mode is active
        addressFields.forEach(e => {
            e.prop('required', true)
        })
        $('#collapseMapButton').addClass('collapsed')
        $('#collapseAddressButton').removeClass('collapsed')
        Collapse.getOrCreateInstance(document.getElementById('collapseMap'), {toggle: false}).hide()
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
        Collapse.getOrCreateInstance(document.getElementById('collapseMap'), {toggle: false}).show()
        Collapse.getOrCreateInstance(document.getElementById('collapseAddress'), {toggle: false}).hide()
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
const mediaList = document.getElementById('mediaList');
const addMediaBtn = document.getElementById('addMediaBtn');

const uploadedMedia = []; // {url, storagePath}

const TEN_MB = 10485760;

addMediaBtn.addEventListener('click', () => {
    if (uploadedMedia.length >= 5) {
        alert('Puoi caricare al massimo 5 file.');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > TEN_MB) {
            alert('Il file supera i 10MB.');
            return;
        }

        const uniqueName = Date.now() + '_' + file.name;
        const storageRef = ref(storage, 'uploads/temp/' + uniqueName);

        // Skeleton Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'position-relative';
        wrapper.style.width = '100px';
        wrapper.style.height = '100px';

        // Skeleton content
        wrapper.innerHTML = `
      <div class="d-flex justify-content-center align-items-center bg-secondary bg-opacity-10" 
           style="width: 100%; height: 100%;">
        <div class="spinner-border text-secondary" role="status"></div>
      </div>
    `;

        mediaList.appendChild(wrapper);

        // Upload
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Optionally handle progress % here
            },
            (error) => {
                wrapper.innerHTML = '<div class="text-danger small">Errore upload</div>';
            },
            async () => {
                const url = await getDownloadURL(storageRef);
                uploadedMedia.push({url, storagePath: storageRef.fullPath});

                const isImage = file.type.startsWith('image/');
                const preview = document.createElement(isImage ? 'img' : 'video');
                preview.src = url;
                preview.style.width = '100px';
                preview.style.height = '100px';
                preview.style.objectFit = 'cover';
                if (!isImage) preview.controls = true;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close position-absolute top-0 end-0';
                removeBtn.addEventListener('click', async () => {
                    await deleteObject(storageRef);
                    uploadedMedia.splice(uploadedMedia.findIndex(m => m.url === url), 1);
                    wrapper.remove();
                });

                wrapper.innerHTML = ''; // Clear skeleton
                wrapper.appendChild(preview);
                wrapper.appendChild(removeBtn);
            }
        );
    };

    input.click();
});

const severityInput = document.getElementById('severity');
const severityValue = document.getElementById('severityValue');

severityInput.addEventListener('input', () => {
    severityValue.textContent = severityInput.value;
});


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
    }

    const docRef = await addDoc(collection(db, 'reports'), reportData);

    const finalMediaUrls = [];
    for (const media of uploadedMedia) {
        const newUrl = await moveFile(media.storagePath, docRef.id);
        finalMediaUrls.push(newUrl);
    }

// Update Firestore doc:
    await updateDoc(docRef, { media: finalMediaUrls });
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


