# Device test protocol

## Scope of this phase: capability only
Right now we only record **what each machine supports**, and which GPU the browser really uses. **Rendering and frame-rate tests wait until the full portfolio is built** (milestone runs at the bottom of this file). So:

- Run the probe's main button only. **Skip** the "optional fill test": it isn't used for any decision yet.
- The probe, the commands and the project tooling are identical on **Windows and Ubuntu**. Nothing in the project depends on a Unix shell: `npm run dev`, `npm run build`, `npm test`, `npm run build:release -- https://<domain>` all work in PowerShell, Windows Terminal and bash.
- The site never branches on the operating system. The OS only labels results.

## Test environments

| # | Environment | Role | Expected tier | What must be verified |
|---|---|---|---|---|
| W | **Windows**, HP Victus, **RTX 2050 4 GB** | Primary T1 test | T1 | Chrome really renders on the RTX 2050, not the Radeon 760M |
| U | **Ubuntu 24.04**, HP Victus, **Radeon 760M** (integrated) | Linux WebGL2 / T1 / T2 test | T1 or T2, decided by measurement | Chrome has hardware WebGL2 on the 760M. If it falls back to software, T3 is the correct result, not a bug |
| L | **Older laptop**, Core i5-4210U, **Intel HD Graphics 4400**, 8 GB | Low-end compatibility test | T2 (4 threads cap it) or T3 | WebGL2 is **not assumed**; this run decides it |
| A | **Android**, low-end | Low-end mobile test | T2 or T3 | Device to be confirmed |

The architecture is unchanged: capability detection decides the tier (see `docs/stage-03-architecture.md` §5). The operating system never does.

### The rule for every run: verify the GPU Chrome actually used
The operating system, the "default GPU" setting and the environment variables only *request* a GPU. Chrome may pick another, or fall back to software. A run only counts if **both** checks agree:

1. **`chrome://gpu`** in the same Chrome window, before running the probe. Look at:
   - *Graphics Feature Status* → **WebGL2: Hardware accelerated** (not "Software only" or "Disabled")
   - *Driver Information* → **GL_RENDERER** (and GPU0/GPU1 lines) naming the expected GPU
2. **The probe's "GPU (unmasked)" row**: it must name the same GPU.

If the two checks name the expected GPU, the run is **valid**. If `chrome://gpu` shows SwiftShader, llvmpipe or Disabled, the run is a valid *T3 fallback* result, but it is **not** a result for that GPU. Label it as such and don't compare timings.

Each JSON file's name already contains the renderer string. Please also say in your message which environment (W / U / L / A) produced it.

> The earlier JSON from Ubuntu (`probe-no-webgl2-2026-11-11144443.json`) came from a Chrome profile whose GPU process had been crashed by a bad PRIME command. Chrome had disabled the GPU for that profile. **Discard it; use fresh profiles.**

---

## Step 0 — the hardware probe

The probe (`public/dev/probe.html`) is one self-contained HTML file. No dependencies, no network requests, nothing sent anywhere. It records:

- whether the browser and GPU support WebGL2, with and without the software-renderer check
- the GPU renderer string
- texture limits and compressed texture formats (which decide KTX2 vs the WebP fallback)
- CPU threads and device memory as the browser reports them
- motion and data preferences
- the GPU class it detected (NVIDIA / AMD / Intel / software …) and the OS, so mismatches are obvious
- a **provisional tier** from capabilities alone (T3 / T2 at most / T1 candidate). The final tier is decided later from measured frame times
- *(optional, later)* a separate fill-test button; not needed in this phase

Each run ends with **Download JSON**. Send me every JSON file.

> Release builds strip `/dev/` automatically. Preview deployments keep it, so later you can also open `https://<preview-url>/dev/probe.html` on any device.

### Serving the probe (same commands on Windows and Ubuntu)
Windows: PowerShell or Windows Terminal. Ubuntu: any terminal. From the project folder:
```
npm install          # first time only
npm run dev          # serves http://localhost:5173 ; leave it running
```
On the Windows side you need Node 20+ (`node -v`). If you'd rather not install it there, copy the single file `public/dev/probe.html` (USB, network share or the repo checkout) and open it directly in Chrome: it has no dependencies and works from `file://`.
Git on Windows: the repo has a `.gitattributes` that forces LF line endings, so files are byte-identical on both systems.

---

### W. Windows — Victus with RTX 2050 (primary T1 test)

**1 · Tell Windows to run Chrome on the RTX 2050**
Settings → System → Display → Graphics → find **Google Chrome** (or *Add desktop app* → `C:\Program Files\Google\Chrome\Application\chrome.exe`) → **Options** → **High performance** → Save. Then **close every Chrome window** (check the system tray) and reopen.

**2 · Check that Chrome picked it**
Open `chrome://gpu`:
- WebGL2 → *Hardware accelerated*
- GL_RENDERER → should contain **NVIDIA GeForce RTX 2050** (on Windows it appears as `ANGLE (NVIDIA, NVIDIA GeForce RTX 2050 ...Direct3D11...)`)
- If it names **AMD Radeon** instead, the setting didn't apply. Repeat step 1, make sure all Chrome processes are closed, then check again.

**3 · Independent check with Windows itself (optional but recommended)**
Task Manager → *Performance* lists the GPUs (GPU 0 / GPU 1) with their names, and *Details* → right-click a column header → *Select columns* → **GPU engine** shows which GPU each chrome.exe process uses. Or in a terminal: `nvidia-smi` lists a chrome.exe process only while Chrome is on the RTX. (An idle page may not show activity; the `chrome://gpu` renderer is the primary check.)

**4 · Run the probe**
`http://localhost:5173/dev/probe.html` → *Run probe* → check the **GPU actually used** row says NVIDIA → *Download JSON*. (Skip the optional fill test.)

**5 · Repeat on the Radeon 760M (Windows)** if you want the comparison: set Chrome back to *Power saving* in the same Graphics settings, restart Chrome, check `chrome://gpu` names the Radeon, run the probe again. Name this run `W-760M`.

**Also record:** `winver` (OS build), `chrome://version` (Chrome version), the NVIDIA driver version (`nvidia-smi` shows it), and save `chrome://gpu` with Ctrl+S.

---

### U. Ubuntu 24.04 — Victus with Radeon 760M (Linux WebGL2 test)

We test the **integrated** GPU here: it's what Chrome uses on Linux by default under `prime-select on-demand`, so no offload tricks are needed. Don't set any `__NV_*` or `DRI_PRIME` variables for this run.

**1 · Plain Chrome with a brand-new profile**
```bash
google-chrome --user-data-dir="$HOME/.cache/probe-u-760m-1" chrome://gpu
```
(A fresh profile name each time avoids a previously crashed GPU process being remembered.)

**2 · Check `chrome://gpu`**
- WebGL2 → *Hardware accelerated*
- GL_RENDERER → should contain **AMD Radeon 760M** (Linux shows it as `ANGLE (AMD, AMD Radeon 760M Graphics (radeonsi ...), OpenGL ...)` or via Vulkan, `RADV PHOENIX`)
- **If it says SwiftShader, Software only or Disabled:** the probe will correctly report no hardware WebGL2 (→ T3). That is a valid and useful result for the fallback path. Save `chrome://gpu` with Ctrl+S and send it with the JSON. Don't try to force the NVIDIA GPU as a workaround; that's what crashed the GPU process before.

**3 · Run the probe in that same window**
`http://localhost:5173/dev/probe.html` → *Run probe* → check **GPU actually used** says AMD → *Download JSON*. (Skip the optional fill test.)

**4 · Independent check (optional)**
```bash
sudo apt install radeontop mesa-utils vulkan-tools   # first time only
glxinfo -B | grep -E "OpenGL renderer|Device"        # system default GPU (should be AMD)
vulkaninfo --summary 2>/dev/null | grep -E "deviceName|driverName"
radeontop                                            # optional: the "gpu" bar shows the AMD GPU is active
```

**Also record:**
```bash
lsb_release -ds; uname -r; echo "$XDG_SESSION_TYPE"   # Ubuntu version, kernel, X11 or Wayland
google-chrome --version
prime-select query                                    # expect: on-demand
```

**Optional Firefox run:** `firefox --new-instance --profile "$(mktemp -d)" http://localhost:5173/dev/probe.html` (WebGL support varies by Snap packaging; the renderer row shows what you got).

> The NVIDIA GPU is tested on Windows (environment W). Ubuntu with the RTX would only measure the Linux hybrid-graphics stack, not the site. If we ever want it, the Vulkan route is in the git history of this file.

---

### L. Older laptop — Core i5-4210U · Intel HD Graphics 4400 · 8 GB

**We do not assume WebGL2 here; this run decides it.** Run the probe in **every browser installed** on it.

**Option 1, offline (simplest):** copy the single file to a USB stick:
```bash
cp ~/Desktop/portfolio/public/dev/probe.html /media/$USER/<USB-STICK>/
```
On the HD 4400 laptop, open the file in each browser (double-click, or drag it into the window). Run it, then download the JSON.

**Option 2, over your home Wi-Fi from the Victus:**
```bash
npm run probe:serve                 # prints a "Network:" URL like http://192.168.x.y:5173/
hostname -I | awk '{print $1}'      # Ubuntu: the same IP. Windows: ipconfig
# Ubuntu, only if the firewall is active (sudo ufw status):
sudo ufw allow 5173/tcp             # remove afterwards: sudo ufw delete allow 5173/tcp
```
On the HD 4400 laptop, open `http://<victus-ip>:5173/dev/probe.html`. Stop the server with Ctrl+C when finished. It exposes the dev server to your local network, so only do this on a network you trust. Windows may also show a firewall prompt: allow *Private networks* only.

**Verify the GPU:** `chrome://gpu` (or `edge://gpu`) must show WebGL2 hardware accelerated and GL_RENDERER naming **Intel(R) HD Graphics 4400**. The HD 4400 is a 2013 GPU: many drivers expose only WebGL1 or have WebGL2 blocklisted. That is expected and is exactly what the T3 fallback is for. Whichever result you get is valid, but **record which**.

**Record the laptop's OS and browser:**
- **Windows:** `winver`, `chrome://version`, the Intel driver version (Device Manager → Display adapters → Intel HD Graphics 4400 → Driver). Save `chrome://gpu` with Ctrl+S.
- **Linux:** `lsb_release -ds; uname -r; glxinfo -B | head -20`, plus the browser version.

---

### A. Low-end Android (device to be confirmed)

Use Option 2 above. Open the LAN URL in Chrome on the phone, run the probe and download the JSON. Also send a screenshot of `chrome://gpu`. Tell me the phone model and Android version.

---

## What the results decide

| Probe result | Consequence |
|---|---|
| `webgl2Strict.ok: false` | Device gets T3 (static stills). No 3D is ever requested. Intended behaviour, not a bug |
| `softwareRendererSuspected: true` | T3 |
| No ETC1S target in `compressedFormats` | T1 uses the WebP 1024 fallback textures, not KTX2 |
| `maxTextureSize < 4096` | Capped at T2 |
| Provisional tier in the JSON | A prediction from capabilities only; confirmed or corrected by measurement in the milestone runs |

What each environment tells us:

| Env | Question it answers |
|---|---|
| W (RTX 2050) | Is the RTX really the GPU Chrome uses? Is WebGL2 hardware accelerated? Is KTX2 supported (BC/S3TC on desktop NVIDIA)? |
| U (Radeon 760M) | Does Linux Chrome give hardware WebGL2? Which compressed formats? Does the fallback path behave when it doesn't? |
| L (HD 4400) | Does WebGL2 exist at all? If no: T3 works with no WebGL calls |
| A (Android) | Mobile capabilities, ETC2/ASTC texture path |

Frame-rate questions (does T1 hold 60 fps on the RTX, is T2 ≥ 30 fps on the HD 4400 …) are answered in the milestone runs below, after the full portfolio is built.

## Rendering tests: after the full portfolio is built
Same four environments, same GPU verification rule. For each environment W / U / L / A, record:
- OS, browser, **GPU confirmed via `chrome://gpu` and the probe row**
- tier chosen and why (dev overlay)
- p50 / p90 / max frame time for index, descent and inside moves (10 runs each)
- draw calls and triangles
- GPU memory (dev ledger + the Chrome Task Manager "GPU memory" column)
- idle frame count over 5 s
- keyboard and screen-reader spot checks

Results go in `docs/device-results/<date>-<env>.md`.
