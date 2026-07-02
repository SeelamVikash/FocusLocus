# FocusLocus 🚀

**FocusLocus** is a premium, self-hosted, multi-user course hub designed to organize, compile, and stream courses using YouTube playlist URLs. Built using **FastAPI (Python)** and **React (JavaScript)**, it provides an isolated, secure, distraction-free environment for learning, both online and offline.

---

## ✨ Features

- **👥 Multi-User Profiles**: Netflix-style user profile selector. Each student gets their own custom stats, streak tracking, courses, notes, and progress configurations.
- **🔒 Circular PIN Keypad Lock**: Protect your dashboard and study notes from others using a secure 4-digit PIN lock screen.
- **🔑 Free Offline Recovery**: Recover forgotten PINs securely by answering a personalized security question. The check runs 100% locally in your SQLite database with no external SMS/email fees.
- **🛡️ YouTube Content Protection**: Downloaded H.264/AAC videos are scrambled (XOR-encrypted) on your disk to prevent standard players (VLC, QuickTime, Windows Media Player) from playing them outside the app, protecting YouTube's integrity.
- **📂 Scoped Range Streaming**: The backend stream decodes the file header on-the-fly and supports HTTP `206 Partial Content` headers, allowing instant scrubbing and seeking of protected local files in the browser.
- **📝 Debounced Video Notes**: Write private notes linked to specific videos. Automatically saves to the database using debounced state updates to prevent browser lag.
- **⏲️ Integrated Pomodoro Timer**: Customizable Work/Break countdown clock (25m / 5m) built directly into the header to keep you in the zone.

---

## 🛠️ Installation & Quick Start

### 🚀 One-Click Setup (Windows - Recommended)
If you are on Windows, simply double-click the **`setup.bat`** file at the root of the project. 
This script will automate everything for you:
1. **Checks for Python**: Detects if Python is installed. If not, it silently downloads and installs Python 3.12 via Windows Package Manager (`winget`).
2. **Installs Libraries**: Installs all required libraries (`fastapi`, `uvicorn`, `yt-dlp`, etc.).
3. **Creates a Desktop Shortcut**: Creates a **FocusLocus** shortcut directly on your Windows Desktop (with a custom Rocket icon) for easy one-click launching!
4. **Launches the Web App**: Automatically spins up the server and opens `http://localhost:8000/` in your browser.

---

### 💻 Manual Installation (All OS)

#### 1. Install Python 3.12+
Download and install Python from the [official website](https://www.python.org/downloads/). Ensure you check the box to **"Add Python to PATH"** during installation.

#### 2. Install Dependencies
Open your command prompt or terminal, navigate to the folder, and run:
```bash
pip install -r requirements.txt
```

#### 3. Start the Server
Run the launcher executable (Windows) or start uvicorn directly:
```bash
# Windows Launcher
.\FocusLocus.exe

# Manual command line (All OS)
python -m uvicorn backend.main:app --port 8000
```
Open your browser to: **[http://localhost:8000/](http://localhost:8000/)**

---

## 📂 Directory Structure

```
d:/Course_App/
├── backend/
│   ├── main.py            # FastAPI App, REST endpoints, and Range Streaming logic
│   ├── database.py        # SQLite Database connection, multi-user schemas, and SQL queries
│   ├── youtube.py         # yt-dlp metadata fetching, downloads hook, and XOR scrambler
│   ├── courses.db         # [Generated] Local SQLite database file
│   └── downloads/         # [Generated] Local directory holding XOR-scrambled video assets
├── frontend/
│   ├── index.html         # Main UI structure with React/Babel compilation bindings
│   ├── app.js             # React Logic, Dashboard, Viewer, Keypad, and Settings Components
│   └── styles.css         # Dark slate glassmorphism layout and styling
├── FocusLocus.exe         # Standard Windows desktop launcher executable (custom icon)
├── FocusLocus.ico         # Custom Rocket icon file
├── setup.bat              # One-click Windows setup installer
├── run_app.bat            # Windows background batch script
├── requirements.txt       # Python package dependencies
└── .gitignore             # Git repository ignored files config
```

---

## 🔧 Debugging & Troubleshooting Guide

### 1. Port 8000 is Already in Use
**Symptom**: `ERROR: [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)`  
**Solution**: Another process or a zombie uvicorn instance is holding port 8000. Free up the port in PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
```

### 2. Python Environment & Library Path Issues
**Symptom**: `No module named uvicorn` or `No module named fastapi`  
**Solution**: On Windows, you may have multiple Python interpreters (e.g. MSYS2 vs Windows Store). Ensure you run `pip` and `uvicorn` using the same executable. The Windows Store Python path usually contains your installed packages:
```powershell
C:\Users\<Username>\AppData\Local\Microsoft\WindowsApps\python.exe -m uvicorn backend.main:app --port 8000
```

### 3. YouTube Downloads / Imports Fail
**Symptom**: `Failed to fetch YouTube details` or `Downloaded video file could not be found`  
**Solution**: YouTube updates its protocols frequently, causing extraction scripts to break. Update the local `yt-dlp` library to the latest release:
```bash
pip install --upgrade yt-dlp
```

### 4. Blank Screen on Launch
**Symptom**: Browser tab shows `FocusLocus | Smart Course Hub` but the page content is completely blank.  
**Solution**: Open Developer Tools (**F12**) and check the Console tab:
- If there are ESM / imports errors, verify your browser allows CDN imports. FocusLocus uses local UMD scripts and Babel compilation to run smoothly offline, but requires loading external libraries from CDN links inside `index.html`. Make sure you are connected to the internet during first load.

---

## ⚖️ Legal Disclaimer & User Discretion
FocusLocus is a self-hosted personal organization utility designed for distraction-free learning. 
* The **video downloading capabilities** utilize third-party extraction tools (`yt-dlp`). Users are solely responsible for ensuring their usage complies with YouTube's Terms of Service, copyright restrictions, and local intellectual property laws. 
* The software is provided **"AS IS"** without warranties of any kind. Under no circumstances shall the authors or copyright holders be liable for any claims, damages, or liabilities arising from the use of this software.

---

## 🤝 Credits & Acknowledgments
This project was born out of a collaborative pair-programming journey:
* **💡 Concept & Product Specifications**: Designed by the Vikash Seelam.
* **💻 Engineering & Implementation**: Developed and polished by **Gemini (Antigravity)**, Google DeepMind's agentic AI software developer.

---

## 📄 License
This project is licensed under the terms of the **MIT License**. See the [LICENSE](file:///d:/Course_App/LICENSE) file for details.
