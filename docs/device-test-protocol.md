# Device test protocol

## Step 0 — hardware probe (M0, before any 3D code)

The probe (`public/dev/probe.html`) is one self-contained HTML file. No dependencies, no network requests, nothing sent anywhere. It records:

- whether the browser and GPU support WebGL2, with and without the software-renderer check
- the GPU renderer string
- texture limits and compressed texture formats (which decide KTX2 vs the WebP fallback)
- CPU threads and device memory as the browser reports them
- motion and data preferences
- a short 1280×720 GPU fill test

Each run ends with **Download JSON**. Send me every JSON file.

> Release builds strip `/dev/` automatically. Preview deployments keep it, so later you can also open `https://<preview-url>/dev/probe.html` on any device.

### A. Victus — run it twice: Radeon 760M (default) and RTX 2050

```bash
cd ~/Desktop/portfolio
npm run dev
# leave it running; it serves http://localhost:5173
```

**1 · Integrated Radeon 760M (what most browsers use by default):**
```bash
google-chrome --user-data-dir="$HOME/.cache/probe-chrome-igpu" "http://localhost:5173/dev/probe.html"
```

**2 · NVIDIA RTX 2050 (PRIME render offload; needs the NVIDIA proprietary driver):**
```bash
prime-select query        # should print "on-demand"; if it prints "intel"/"amd", the dGPU is off
nvidia-smi                # should list the RTX 2050

__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia __VK_LAYER_NV_optimus=NVIDIA_only \
  google-chrome --user-data-dir="$HOME/.cache/probe-chrome-nvidia" "http://localhost:5173/dev/probe.html"
```

The separate `--user-data-dir` forces a fresh GPU process each time. **Check the "GPU (unmasked)" row:**
- run 1 should name the AMD Radeon
- run 2 should name the NVIDIA GeForce RTX 2050
- if run 2 still shows AMD, the offload variables didn't take effect: tell me and send that JSON anyway

Optional, same pattern in Firefox (Snap Firefox may ignore the variables; the renderer row tells you):
```bash
__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia firefox --new-instance --profile "$(mktemp -d)" "http://localhost:5173/dev/probe.html"
```

Also record:
```bash
lsb_release -ds; uname -r
google-chrome --version
glxinfo -B | head -20      # needs: sudo apt install mesa-utils
```

### B. Secondary laptop — Core i5-4210U · Intel HD Graphics 4400 · 8 GB

**We do not assume WebGL2 here; this run decides it.**

**Option 1, offline (simplest):** copy the single file to a USB stick:
```bash
cp ~/Desktop/portfolio/public/dev/probe.html /media/$USER/<USB-STICK>/
```
On the HD 4400 laptop, open the file in **each** browser you use (double-click, or drag it into the window). Run it, then download the JSON.

**Option 2, over your home Wi-Fi from the Victus:**
```bash
# on the Victus
cd ~/Desktop/portfolio
npm run probe:serve                 # prints a "Network:" URL like http://192.168.x.y:5173/
hostname -I | awk '{print $1}'      # the same IP, if you need it
# only if Ubuntu's firewall is active (sudo ufw status):
sudo ufw allow 5173/tcp             # remove afterwards: sudo ufw delete allow 5173/tcp
```
On the HD 4400 laptop, open `http://<victus-ip>:5173/dev/probe.html`. Stop the server with Ctrl+C when finished. It exposes the dev server to your local network, so only do this on a network you trust.

Record the laptop's OS and browser:
- **Windows:** press Win+R, type `winver` (OS build). Open `chrome://version` or `edge://version`. Open `chrome://gpu`, press Ctrl+S and send the saved page: it shows whether the driver is blocklisted.
- **Linux:** `lsb_release -ds; uname -r; glxinfo -B | head -20`, plus your browser's version.

### C. Low-end Android (once chosen)

Use Option 2 above. Open the LAN URL in Chrome on the phone, run the probe and download the JSON. Also send a screenshot of `chrome://gpu`.

### What the results decide
| Probe result | Consequence |
|---|---|
| `webgl2Strict.ok: false` | Device gets T3 (static stills). No 3D is ever requested. Release behaviour, not a bug |
| `softwareRendererSuspected: true` | T3 |
| No ETC1S target in `compressedFormats` | T1 uses the WebP 1024 fallback textures, not KTX2 |
| `maxTextureSize < 4096` | Capped at T2 |
| Fill test p90 | Starting point for the Stage 04 governor thresholds; becomes a measured number |

## Milestone runs (M1 onward)
For each device and browser, record:
- OS, browser, renderer string
- tier chosen and why (dev overlay)
- p50 / p90 / max frame time for index, descent and inside moves (10 runs each)
- draw calls and triangles
- GPU memory (dev ledger + the Chrome Task Manager "GPU memory" column)
- idle frame count over 5 s
- keyboard and screen-reader spot checks

Results go in `docs/device-results/<date>-<device>.md`.
