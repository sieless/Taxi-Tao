# New Device Setup & Migration Guide

This guide contains all requirements, installs, environment variables, and step-by-step instructions for transferring and running both **TaxiTao** and **AGI Trading Lab** on a new device.

---

## 🛠️ 1. Core System Requirements & Software Installs

Before setting up the projects, download and install the following software:

1. **Git**
   - Download & Install: [git-scm.com](https://git-scm.com/)
2. **Node.js** (v18.x or v20.x LTS recommended)
   - Download & Install: [nodejs.org](https://nodejs.org/)
   - Includes `npm` package manager.
3. **Python 3.10 or 3.11**
   - Download & Install: [python.org](https://python.org/)
   - ⚠️ **Important (Windows)**: Ensure you check **"Add Python to PATH"** during installation.
4. **MetaTrader 5 Desktop Terminal** (Required for MT5 / Forex Trading)
   - Download MetaTrader 5 terminal from your broker or [metatrader5.com](https://www.metatrader5.com/).
   - Log into your broker account in MT5.
   - Go to `Tools` -> `Options` -> `Expert Advisors` -> Enable **"Allow Algo Trading"**.

---

## 📱 2. TaxiTao Web Application (`Taxi-Tao`)

### Step 1: Copy Codebase
Transfer the project folder to your new device.
* Do **NOT** copy `node_modules` or `.next`.

### Step 2: Install Node Packages
Open terminal in `Taxi-Tao`:
```powershell
npm install
```

### Step 3: Environment Variables Setup (`.env.local`)
Create a file named `.env.local` in the `Taxi-Tao` root folder:
```env
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional / External APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
RESEND_API_KEY=your_resend_key
```

### Step 4: Run Development Server
```powershell
npm run dev
```

---

## 🤖 3. AGI Trading Lab (`ai_trading_lab-claude`)

### Step 1: Copy Codebase
Transfer the project folder to your new device. 
* Do **NOT** copy `venv`, `__pycache__`, or `.pytest_cache`.

### Step 2: Create Python Virtual Environment
Open terminal / PowerShell in `ai_trading_lab-claude`:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Required Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

#### Package List (`requirements.txt`):
* `google-generativeai>=0.8.0` (Gemini API Integration)
* `pydantic>=2.0.0` (Data validation)
* `MetaTrader5>=5.0.5600` (MT5 Integration)
* `websocket-client>=1.8.0` (Deriv WS connection)
* `requests>=2.31.0`
* `pandas>=2.0.0`, `numpy>=1.24.0` (Data analysis)
* `filelock>=3.13.0` (Thread-safe storage)
* `rich>=13.7.0` (CLI interface formatting)
* `PyGithub>=2.0.0` (GitHub crawler)
* `chromadb>=1.5.9` (Vector DB / RAG)
* `gymnasium>=0.29.0` (RL environment)

### Step 4: Environment Variables Setup (`.env`)
Create a file named `.env` in the `ai_trading_lab-claude` root folder:
```env
# AI / LLM Keys
GEMINI_API_KEY=your_gemini_api_key_here
NVIDIA_API_KEY=your_nvidia_nim_key_here

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Deriv (Synthetic Indices)
DERIV_API_TOKEN=your_deriv_api_token_here

# Market News API
NEWS_API_KEY=your_newsapi_key_here
```

### Step 5: Database & State Migration (Optional)
- **Fresh Start**: Run the system directly. SQLite databases (`agi_state.db`, `telemetry.db`, `state.db`) will auto-initialize.
- **Keep History**: Copy `agi_state.db`, `telemetry.db`, and `state.db` from your old device to preserve execution logs, trade history, and agent learning records.

### Step 6: Test & Launch
```powershell
# Test broker and API connection
python test_connection.py

# Run main trading orchestrator
python orchestrator.py
```

---

## ✅ Transfer Checklist

- [ ] Software installed: Git, Node.js, Python (added to PATH), MT5 Terminal.
- [ ] Codebase copied without build artifacts (`node_modules`, `.next`, `venv`).
- [ ] `Taxi-Tao`: `npm install` executed successfully.
- [ ] `Taxi-Tao`: `.env.local` file configured with Firebase & Upstash credentials.
- [ ] `ai_trading_lab-claude`: Virtual environment created & `requirements.txt` installed.
- [ ] `ai_trading_lab-claude`: `.env` file configured with API keys.
- [ ] MT5 terminal launched with Algo Trading enabled.
