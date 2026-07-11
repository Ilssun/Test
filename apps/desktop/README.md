# Carnet d'entraînement — Desktop (Windows)

This Electron shell packages the Expo web export as a native Windows app.

## Build steps

1. From the repo root, build the web bundle:
   ```
   npm run web:export
   ```
   This runs `expo export --platform web` inside `apps/mobile` and produces
   `apps/mobile/dist/`.

2. Copy the export into this app's `web/` folder:
   ```
   rm -rf apps/desktop/web
   cp -r apps/mobile/dist apps/desktop/web
   ```

3. Install Electron deps and build the Windows installer:
   ```
   cd apps/desktop
   npm install
   npm run build
   ```
   The `.exe` (NSIS installer) is produced in `apps/desktop/release/`.

Replace `apps/desktop/icon.ico` with a real 256×256 `.ico` before shipping —
a placeholder is not included in this repo.
