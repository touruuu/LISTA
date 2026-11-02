# LISTA

LISTA is a mobile-first ledger interface for recording utang, payments, customer balances, and consent evidence. This repository currently contains the frontend and project documentation only.

## Project structure

```text
LISTA/
├── frontend/
│   ├── public/             Static icons and web manifest
│   ├── src/
│   │   ├── data/           Temporary, replaceable sample data
│   │   ├── lib/            Browser utilities such as camera capture
│   │   ├── services/       Frontend data-access boundary
│   │   ├── App.jsx
│   │   ├── listaApp.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── test/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── mockups/            LISTA.pdf, visual references, and screenshots
│   └── project/            Product specifications and project notes
├── .gitignore
└── README.md
```

## Frontend setup

Requires Node.js 20 or newer.

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

Run checks and create a production build:

```bash
npm test
npm run build
```

## Backend status

The backend is intentionally not implemented yet. The current UI uses temporary in-memory data from `frontend/src/data/sampleLedger.js` through `frontend/src/services/ledgerService.js`. This boundary is deliberately small so a future backend client can replace the temporary service without coupling API details to the UI.

Temporary changes reset when the browser page reloads. Frontend interactions are available directly; real authentication will be added with the future backend.
