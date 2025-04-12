import 'bootstrap/dist/css/bootstrap.min.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {app} from "./firebase.js"
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {GeoSearch} from "./GeoSearch.js";
import {AddressAutocomplete} from "./AddressAutocomplete.js";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Form elements
const addressInput = document.getElementById('address');
const suggestionsBox = document.getElementById('addressSuggestions');
const reportForm = document.getElementById('reportForm');
const resultDiv = document.getElementById('result');

let selectedAddress = null;

// Map setup
const map = L.map('map').setView([37.6, 14.0], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = null;

function updateMap(lat, lon) {
    if (marker) {
        marker.setLatLng([lat, lon]);
    } else {
        marker = L.marker([lat, lon], { draggable: true }).addTo(map);
        marker.on('dragend', function (e) {
            const pos = e.target.getLatLng();
            selectedAddress.lat = pos.lat;
            selectedAddress.lon = pos.lng;
        });
    }
    map.setView([lat, lon], 16);
}

// Allow user to click on map to set marker
map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    selectedAddress = {
        displayName: 'Posizione selezionata sulla mappa',
        lat: lat,
        lon: lon
    };
    updateMap(lat, lon);
});

// Auto-complete with Photon
const geoSearch = new GeoSearch(map);

let selectedAddressGlobal = document.getElementById("address")
const autocomplete = new AddressAutocomplete(addressInput, suggestionsBox, geoSearch, (selectedAddress) => {
    selectedAddressGlobal = selectedAddress;
    updateMap(selectedAddress.lat, selectedAddress.lon);
});

// Handle form submit
reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedAddress) {
        alert('Seleziona o imposta una posizione sulla mappa.');
        return;
    }

    // Just printing for now — replace with your Firestore save
    console.log({
        email: document.getElementById('email').value,
        sintesi: document.getElementById('summary').value,
        descrizione: document.getElementById('description').value,
        categoria: document.getElementById('category').value,
        gravita: document.getElementById('gravity').value,
        indirizzo: selectedAddress.displayName,
        coordinate: {
            lat: selectedAddress.lat,
            lon: selectedAddress.lon
        }
    });

    resultDiv.className = 'alert alert-success';
    resultDiv.textContent = 'Segnalazione inviata!';
    resultDiv.classList.remove('d-none');
});

const storage = getStorage(app);
const mediaList = document.getElementById('mediaList');
const addMediaBtn = document.getElementById('addMediaBtn');

const uploadedMedia = []; // {url, storagePath}

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
        if (file.size > 10 * 1024 * 1024) {
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
                uploadedMedia.push({ url, storagePath: storageRef.fullPath });

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