# JIT Reporter

A Next.js web application that replaces the legacy Excel-based JIT (Just In Time) reporting process. Manufacturing engineers can manage a watch list of part numbers they want to observe on the manufacturing floor, and a Jenkins pipeline emails them when matching production orders appear.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, React 19)
- **Tailwind CSS v4** — styling with dark/light mode
- **better-sqlite3** — local SQLite database for the watch list
- **mssql / msnodesqlv8** — SQL Server data warehouse access via Windows Integrated Auth
- **Vitest** — unit tests

## Local Development

```powershell
npm install
npm run dev        # http://localhost:3000
```

### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Deploying on a Windows Server

### Prerequisites

- **Node.js 20+** — download the LTS installer from [nodejs.org](https://nodejs.org)
- **ODBC Driver 17+ for SQL Server** — required by `msnodesqlv8` for data warehouse access
- **Windows account with DW read access** — the service runs under this identity and uses Integrated Auth (no password stored)
- **Visual C++ Build Tools** — required to compile native modules (`better-sqlite3`, `msnodesqlv8`). Install via `npm install -g windows-build-tools` or from [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### 1. Install the Application

```powershell
# Clone the repo (or copy the release archive)
git clone <repo-url> C:\Apps\jit-reporter
cd C:\Apps\jit-reporter\jit-reporter-next

# Install dependencies and build
npm ci
npm run build
```

### 2. Configure the Port (Optional)

By default the server listens on port **3000**. To change it, set the `PORT` environment variable before starting:

```powershell
$env:PORT = "3001"
```

### 3. Verify It Starts

```powershell
npm start
# Open http://localhost:3000 in a browser
# Ctrl+C to stop
```

The SQLite database (`jit.db`) is created automatically on first request. Confirm the data warehouse connection by loading the **Upcoming Production Orders** page.

### 4. Run as a Windows Service

Use [NSSM](https://nssm.cc/) (Non-Sucking Service Manager) to run the app as a background service that starts on boot:

```powershell
# Download nssm and place it on the PATH (or reference it directly)
nssm install JitReporter "C:\Program Files\nodejs\node.exe"
nssm set JitReporter AppParameters "C:\Apps\jit-reporter\jit-reporter-next\node_modules\.bin\next" start
nssm set JitReporter AppDirectory "C:\Apps\jit-reporter\jit-reporter-next"
nssm set JitReporter AppEnvironmentExtra "NODE_ENV=production" "PORT=3000"
nssm set JitReporter DisplayName "JIT Reporter"
nssm set JitReporter Description "JIT Reporter Next.js web application"
nssm set JitReporter Start SERVICE_AUTO_START
nssm set JitReporter AppStdout "C:\Apps\jit-reporter\logs\stdout.log"
nssm set JitReporter AppStderr "C:\Apps\jit-reporter\logs\stderr.log"
nssm set JitReporter AppRotateFiles 1
nssm set JitReporter AppRotateBytes 5242880

# Create log directory
New-Item -ItemType Directory -Path "C:\Apps\jit-reporter\logs" -Force

# Start the service
nssm start JitReporter
```

> **Important:** Set the service **Log On** account to a domain account that has read access to the data warehouse (`dw-sql\rdw`). Right-click the service in `services.msc` → **Properties** → **Log On** tab, or use:
> ```powershell
> nssm set JitReporter ObjectName "DOMAIN\svc-jitreporter" "password"
> ```

### 5. Firewall

Open the listening port so Jenkins and users can reach the app:

```powershell
New-NetFirewallRule -DisplayName "JIT Reporter" `
    -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 6. Updating the Application

```powershell
nssm stop JitReporter

cd C:\Apps\jit-reporter
git pull

cd jit-reporter-next
npm ci
npm run build

nssm start JitReporter
```

## Jenkins Integration

The `Jenkinsfile` at the repo root runs on a cron schedule (weekdays at 6 AM). It calls the API endpoints to generate the JIT report and email it to active watchers. Update the `JIT_REPORTER_URL` environment variable in the Jenkinsfile to point to your server:

```groovy
JIT_REPORTER_URL = 'http://your-server:3000'
```

### API Endpoints Used by Jenkins

| Endpoint | Description |
|---|---|
| `GET /api/jit/report/html` | HTML email body — watch list cross-referenced with upcoming production |
| `GET /api/jit/watchers` | JSON array of active watcher email addresses |
| `GET /api/jit/report` | JSON report data |
| `GET /api/jit/watchlist` | Full watch list as JSON |
