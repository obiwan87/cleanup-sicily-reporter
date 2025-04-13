# Cleanup Sicily - Segnalazione di Problemi Urbani

Applicazione web leggera per la segnalazione di problemi urbani come rifiuti abbandonati, discariche abusive, buche stradali, alberi pericolanti o mal curati, e altre criticità presenti nel territorio.

L'obiettivo del progetto è fornire ai cittadini uno strumento semplice e accessibile per inviare segnalazioni relative ai problemi della propria città. Le segnalazioni possono includere una descrizione, una categoria, contenuti multimediali (foto/video) e informazioni precise sulla posizione.

Il progetto è pensato con un'architettura pulita e scalabile, adatta ad essere estesa in futuro con funzionalità come la moderazione, strumenti di analisi o dashboard pubbliche.

---

## Struttura del Progetto

Il repository è organizzato come monorepo ed è suddiviso in due parti principali:

urban-issue-reporter/ ├── frontend/ → Web form Vite + JavaScript Vanilla (parte pubblica) ├── backend/ → API Kotlin + Spring Boot e strumenti di amministrazione (backend interno)

yaml
Kopieren
Bearbeiten

---

### Frontend

- Realizzato con Vite e JavaScript Vanilla.
- Deploy su Firebase Hosting.
- Funzionalità:
    - Modulo di segnalazione semplice e intuitivo.
    - Upload dei media con anteprima e feedback immediato.
    - Modalità di scelta della posizione:
        - Inserimento indirizzo completo (autocomplete via Photon).
        - Selezione su mappa (Leaflet + reverse geocoding via Nominatim).
        - Inserimento link di Google Maps per estrarre la posizione.
- I dati delle segnalazioni vengono salvati su Firestore.
- I file media vengono caricati su Firebase Storage.

---

### Backend

- Sviluppato in Kotlin con Spring Boot.
- Funzionalità previste:
    - Job schedulati (es. pulizia periodica dei file temporanei su Firebase Storage).
    - API REST per esportazione dei dati delle segnalazioni (JSON / CSV).
    - Interfaccia di amministrazione per la gestione e moderazione delle segnalazioni.
- Comunicazione con Firebase tramite Firebase Admin SDK.

---

## Strategia di Deploy

| Componente | Hosting | Descrizione |
|------------|---------|-------------|
| Frontend   | Firebase Hosting | Form statico con chiamate API al backend. Ottimizzato con CDN. |
| Backend    | Cloud Run / VPS / Hetzner | API interne e job schedulati. Funzionalità di amministrazione privata. |

---

## Roadmap

- [x] Modulo di invio segnalazioni.
- [x] Modalità multiple per scegliere la posizione.
- [x] Upload dei file con anteprima.
- [x] Integrazione Firestore & Storage.
- [x] Regole di sicurezza Firestore & Storage.
- [ ] Backend API con job schedulati.
- [ ] Esportazione dati (CSV, JSON).
- [ ] Interfaccia di amministrazione.

---

## Licenza

MIT — Libero utilizzo, modifica e distribuzione.

---

## Contribuire

Contributi e segnalazioni di issue sono benvenuti!  
Apri una pull request o una issue per suggerimenti o miglioramenti.