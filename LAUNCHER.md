# Wisp Launcher (Launch-Wisp.ps1)

A PowerShell launcher that builds and starts the Wisp app from your Windows desktop with a single click. It opens a small menu where you can start the site, stop it, or open it in your browser — instead of manually running multiple commands in separate terminal windows.

---

## What it does

The launcher manages the two app processes that have to run for the site to work:

1. **Backend** — the Go API server (`go run main.go`) on port 8080
2. **Frontend** — the Next.js production server (`npm start`) on port 3000

Before starting the frontend, it runs `npm run build` so the live site always reflects your latest code. If the build fails, the launcher stops and shows the error instead of serving a broken version.

> The **PostgreSQL** database and the **Cloudflare Tunnel** run as Windows services and start automatically with the PC, so the launcher does not need to manage them.

---

## Menu options

| Option | Action |
|--------|--------|
| **1 — Start Wisp** | Starts the backend, builds the frontend, then starts the frontend. Each server opens in its own window. |
| **2 — Stop Wisp** | Stops the running backend and frontend processes. |
| **3 — Open wispapp.net** | Opens the live site in your default browser. |
| **4 — Exit** | Closes the launcher menu (leaves running servers untouched). |

---

## Setup

### 1. Save the script

Place `Launch-Wisp.ps1` on your Desktop:

```
C:\Users\<you>\Desktop\Launch-Wisp.ps1
```

Update the two paths near the top of the script if your project lives elsewhere:

```powershell
$client = "C:\Users\hacke\Documents\GitHub\Shopping-Website\client"
$server = "C:\Users\hacke\Documents\GitHub\Shopping-Website\server"
```

### 2. Create a desktop shortcut

Windows opens `.ps1` files in an editor when double-clicked, so you launch it through a shortcut instead:

1. Right-click the Desktop → **New → Shortcut**
2. Enter this as the location (adjust the path if needed):
   ```
   powershell.exe -ExecutionPolicy Bypass -File "C:\Users\<you>\Desktop\Launch-Wisp.ps1"
   ```
3. Name it **Wisp** → Finish

The `-ExecutionPolicy Bypass` flag lets the script run without changing your system-wide PowerShell policy.

### 3. (Optional) Give it an icon

Right-click the shortcut → **Properties → Change Icon** → pick an icon.

---

## Usage

1. Double-click the **Wisp** shortcut.
2. Choose **1** to build and launch. Two windows open — one for the backend, one for the frontend. Leave them running.
3. The site is live at [wispapp.net](https://wispapp.net) once both have started.
4. To stop the site, choose **2**, or close the two server windows.

### Publishing changes

Because the frontend is served as a production build, edits do not appear until you rebuild. The launcher handles this automatically: after changing code, just run **Start Wisp** again — it rebuilds before serving.

---

## (Optional) Start automatically on boot

Since the app is self-hosted 24/7, you can have it launch whenever Windows starts:

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Drop a shortcut to `Launch-Wisp.ps1` into that folder.

Wisp will then start each time the PC boots.

---

## Troubleshooting

| Problem | Cause / Fix |
|---------|-------------|
| Double-clicking the `.ps1` opens an editor | Normal — launch via the **shortcut**, not the file directly. |
| "Running scripts is disabled" | The shortcut must include `-ExecutionPolicy Bypass`. |
| "No production build" error | The build step did not finish — run **Start Wisp** again and watch for build errors. |
| Site loads but shows old content | A new build did not run — use **Start Wisp** (which rebuilds), not just a manual `npm start`. |
| Backend window closes immediately | The Go server hit an error on startup — run `go run main.go` manually in the `server` folder to see it. |
