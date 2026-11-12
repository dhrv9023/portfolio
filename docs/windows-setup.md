# Windows setup

Everything in this project is cross-platform: the same `npm` commands work in PowerShell, Windows Terminal and Ubuntu.

## 1. Install once
1. **Node.js LTS** (version 20 or newer) from https://nodejs.org. Check in PowerShell: `node -v` and `npm -v`.
2. **Git for Windows** (optional, only if you want version control there): https://git-scm.com. During setup keep the default line-ending choice; the repo's `.gitattributes` forces LF anyway.
3. **Google Chrome**. Blender 4.x is already installed.

## 2. Unpack and install
1. Unzip `dhruv-sehgal-portfolio.zip` to a short path without spaces, for example `C:\dev\portfolio` (avoid OneDrive/Desktop-synced folders: they slow `npm install` and can lock files).
2. Open PowerShell in that folder (File Explorer → address bar → type `powershell` → Enter):
   ```powershell
   npm install
   npx playwright install chromium     # only needed to run the browser tests
   ```
   `node_modules` is intentionally not in the zip; `npm install` rebuilds it from `package-lock.json`.

## 3. Check it works
```powershell
npm test            # typecheck + unit tests
npm run dev         # http://localhost:5173
npm run test:e2e    # builds, then browser tests (optional)
```

## 4. Hardware probe (later)
After the full site is built, open `public\dev\probe.html` directly in Chrome, or use `http://localhost:5173/dev/probe.html` while `npm run dev` runs. See `docs/device-test-protocol.md` (section W, Windows with the RTX 2050).

## 5. Blender
`.blend` files stay **outside** this folder (they are git-ignored). Suggested layout: `C:\dev\portfolio-blender\` next to the project. The Blender scripts arrive in M2; they will be plain Python files under `assets-src\bpy\`, run from Blender's Scripting tab or `blender --background --python <file>`.

## Moving back to Ubuntu
Copy the folder (without `node_modules`) back and run `npm install` there. Do not copy `node_modules` between operating systems.
