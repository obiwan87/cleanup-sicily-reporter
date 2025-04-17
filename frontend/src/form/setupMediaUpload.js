import 'bootstrap/dist/css/bootstrap.min.css'

import {deleteObject, getDownloadURL, ref, uploadBytesResumable} from "firebase/storage";

export const uploadedMedia = [] // { url, storagePath }

let storage = null
const MAX_MEDIA = 5
const TEN_MB = 10485760

export function setupMediaUpload(_storage) {

    storage = _storage
    renderSlots()
}

function renderSlots() {
    const mediaGrid = document.getElementById('mediaGrid');
    mediaGrid.innerHTML = '';

    for (let i = 0; i < MAX_MEDIA; i++) {
        const slot = document.createElement('div');
        slot.className = 'media-slot position-relative';


        const uploaded = uploadedMedia[i];
        if (uploaded) {
            const img = document.createElement('img');
            img.src = uploaded.url;
            slot.appendChild(img);

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn p-2 position-absolute';
            btn.style.background = 'rgba(255, 255, 255, 0.7)';
            btn.style.borderRadius = '50%';
            btn.style.width = '32px';
            btn.style.height = '32px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.top = '8px';
            btn.style.right = '8px';
            btn.innerHTML = '<i class="bi bi-x text-danger fs-5 m-0"></i>';
            slot.appendChild(btn);
        } else {
            slot.innerHTML = `
        <div class="text-muted text-center">
          <i class="bi bi-image fs-1"></i>
          <div class="small">Aggiungi immagine</div>
        </div>
      `;
            slot.addEventListener('click', () => openUploadDialog(i));
        }

        mediaGrid.appendChild(slot);
    }
}

function openUploadDialog(slotIndex) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file || file.size > TEN_MB || uploadedMedia.length >= MAX_MEDIA) return;

        const uniqueName = Date.now() + '_' + file.name;
        const path = `uploads/temp/${uniqueName}`;
        const storageRef = ref(storage, path);

        const mediaGrid = document.getElementById('mediaGrid');
        const slot = mediaGrid.querySelectorAll('.media-slot')[slotIndex];
        slot.innerHTML = '';

        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'progress position-absolute top-0 start-0 w-100 h-100';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
        progressBar.style.width = '0%';

        progressWrapper.appendChild(progressBar);
        slot.appendChild(progressWrapper);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', (snapshot) => {
                const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = `${percent.toFixed(0)}%`;
            },
            (error) => {
                slot.innerHTML = '<div class="text-danger small">Errore upload</div>';
            },
            async () => {
                const url = await getDownloadURL(storageRef);
                uploadedMedia.splice(slotIndex, 0, {url, storagePath: path});
                renderSlots();
            });
    };

    document.body.appendChild(input);
    input.click();
}
