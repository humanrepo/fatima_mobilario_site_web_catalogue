# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Fatima Mobiliário – Web catalogue (frontend static site + PHP REST API + Firebase)

Commands you’ll use often

- Install dependencies
  - PHP (backend)
    ```bash path=null start=null
    composer install
    ```
  - Node (frontend tooling only)
    ```bash path=null start=null
    npm install
    ```

- Local development
  - Frontend static server (serves public/)
    ```bash path=null start=null
    npm run dev
    ```
  - Sass styles (watch and build to public/assets/css)
    ```bash path=null start=null
    npm run build
    ```
    One-off CSS build (without watch):
    ```bash path=null start=null
    npm run css:build
    ```
    Clean generated CSS:
    ```bash path=null start=null
    npm run clean:css
    ```
  - PHP built-in server (serves the site from public/)
    ```bash path=null start=null
    php -S localhost:8000 -t public
    ```
  - Firebase local serve (uses config/firebase.json from this repo)
    ```bash path=null start=null
    firebase serve --config config/firebase.json
    ```
  - Combined: Sass watch + PHP server
    ```bash path=null start=null
    npm run dev:full
    ```
  - Combined: Sass watch + Firebase emulator
    ```bash path=null start=null
    npm run dev:emulate
    ```

- Deploy (Firebase Hosting)
  ```bash path=null start=null
  firebase deploy --config config/firebase.json
  ```

- Tests (PHPUnit – no tests currently present in the repo, but phpunit is required in composer.json)
  - Run all tests (when a tests/ directory exists)
    ```bash path=null start=null
    # Cross-platform invocation
    php vendor/bin/phpunit
    ```
  - Run a single test (example)
    ```bash path=null start=null
    php vendor/bin/phpunit --filter ProductControllerTest tests/Feature/ProductControllerTest.php
    ```

- Notes on linting
  - No lint scripts are defined in package.json. CSS/JS linting is not configured.

High-level architecture and where things live

- Frontend (public/)
  - Static site delivered from public/ with HTML/CSS/JS. Primary entry points like index.html live here alongside assets/.
  - Client-side Firebase usage is centralized in public/assets/js/firebase.js. It initializes Firebase (Auth, Firestore, Storage) and exposes helpers:
    - Listing/searching products (reads Firestore documents with status == "published")
    - Upload/delete product images to Storage (with basic size/type checks on the client)
    - Admin sign-in/sign-out and auth state listener
    - Simple price/date formatting utilities
  - Admin UI pages live under admin/ and are intended to interact with Firebase-authenticated flows and server endpoints for privileged actions (create/update products, uploads).

- Backend API (api/)
  - Single entrypoint router in api/index.php:
    - Normalizes the /api path and routes to logical handlers for products, upload, auth, and a /health endpoint.
    - Global JSON response helpers (sendResponse/sendError), CORS handling, input size/type validation, and structured exception/error handling are built-in.
  - Utilities
    - api/utils/security.php – input validation/sanitization, CSRF tokens, SQL escaping helpers, simple rate limiting and brute-force protection, security event logging.
    - api/utils/helpers.php – value validation/formatting (email, password, price), slug generation, image file checks, UUID/tokens, secure JSON serialization.
  - Configuration
    - api/config/firebase.php – initializes Firebase Admin SDK for PHP (Firestore, Storage, Auth via Kreait/Google clients). Provides helpers to verify ID tokens, set custom claims, and CRUD product documents in Firestore. Includes Storage helpers for upload/delete.
    - api/config/database.php – optional MySQL (PDO) connection used for caching/sessions/audit logs. Creates/maintains tables such as admin_sessions, product_cache, audit_logs, statistics_cache.
  - Endpoints
    - The router requires files in api/endpoints/ (products.php, upload.php, auth.php). If these files are missing, add them under api/endpoints/ to implement the methods the router expects:
      - GET /api/products, GET /api/products/{id}
      - POST/PUT/DELETE /api/products/{id}
      - POST /api/upload
      - POST /api/auth/login, POST /api/auth/logout, GET /api/auth/verify

- Hosting and Firebase config (config/)
  - config/firebase.json – Firebase Hosting configuration for this project. Notably:
    - Rewrites /api/** to /api/index.php so PHP powers the API under Hosting.
    - Rewrites everything else to /index.html for the static site.
    - Sets long Cache-Control headers for assets under /assets/.
  - config/firestore.rules and config/storage.rules – security rules referenced by the config above. Use the --config flag in Firebase CLI so these rule paths resolve correctly.

Operational details to keep in mind

- Environment and secrets
  - Service account JSON for the backend must be placed at api/config/firebase-credentials.json and referenced via FIREBASE_CREDENTIALS_PATH (api/config/firebase.php supports both path and base64 env loading).
  - Expected env vars (see README/INSTALL): FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_CREDENTIALS_PATH, and optional DB_* for MySQL. Create a .env in the repo root and ensure your runtime loads it.

- Local vs Hosting routing
  - When serving locally via PHP (php -S ... -t public), API requests to /api/* are handled by public routing only if your web server maps /api to api/index.php. Under Firebase Hosting this mapping is configured via config/firebase.json rewrites.
  - To emulate Hosting locally with the same rewrites, prefer: `firebase serve --config config/firebase.json`.

- Build tooling
  - Node usage is limited to live-server for static hosting during development and sass for SCSS->CSS. There is no bundler pipeline.
  - package.json scripts:
    ```json path=C:\Users\dante\projects\fatima_mobilario_site_web_catalogue\package.json start=6
    "scripts": {
      "build": "sass public/assets/scss:public/assets/css --watch",
      "dev": "live-server public/",
      "firebase:deploy": "firebase deploy",
      "firebase:serve": "firebase serve"
    }
    ```
    For Firebase CLI tasks in this repo, prefer passing the explicit config path:
    ```bash path=null start=null
    firebase serve --config config/firebase.json
    firebase deploy --config config/firebase.json
    ```

- Data model (Firestore – products collection)
  - Products are expected to have: name, code, price, status (draft|published|out_of_stock), images[], and timestamps. Public reads query only published items. Admin operations should set/update timestamps and normalized search fields (e.g., name_lowercase, code_lowercase) as seen in client helpers.

Quick start checklist for a fresh environment

1) Install dependencies
```bash path=null start=null
composer install
npm install
```
2) Configure Firebase
```bash path=null start=null
# Put service account at: api/config/firebase-credentials.json
# And set env vars in .env as per README/INSTALL
```
3) Run locally (choose one workflow)
- Static + PHP built-in server
```bash path=null start=null
npm run build
php -S localhost:8000 -t public
```
- Firebase Hosting emulator (mirrors rewrites)
```bash path=null start=null
firebase serve --config config/firebase.json
```

If anything is unclear, check README.md and INSTALL.md in the repo for fuller setup and deployment steps.
