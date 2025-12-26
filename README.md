# 🏥 Digital Health Wallet

A simple web app to store and manage your health records.

---

## ✨ Features

- **Store Reports** – Upload PDFs and images of medical records
- **Track Vitals** – Log blood pressure, heart rate, sugar levels
- **Share Access** – Let doctors or family view your records
- **Secure Login** – Password protected with JWT tokens

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd BACKEND
npm install
npm start
```
Runs on: `http://localhost:5001`

### 2. Start Frontend
```bash
cd "FRONTEND "
npm install
npm run dev
```
Runs on: `http://localhost:5173`

### 3. Open App
Go to `http://localhost:5173` in your browser.

---

## 🔑 Test Account

| Field | Value |
|-------|-------|
| Email | demo@healthwallet.com |
| Password | demo1234 |

---

## 📁 Folder Structure

```
DIGITAL HEALTH WALLET/
├── BACKEND/          # Node.js + Express server
│   ├── routes/       # API endpoints
│   ├── uploads/      # Stored files
│   └── server.js     # Main entry
│
└── FRONTEND /        # React app
    ├── src/pages/    # App screens
    └── src/context/  # Auth state
```

---

## 🛠️ Tech Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| React | Node.js | SQLite |
| Vite | Express | - |
| Chart.js | JWT | - |

---

## 📞 API Endpoints

| Action | Method | URL |
|--------|--------|-----|
| Register | POST | /api/auth/register |
| Login | POST | /api/auth/login |
| Add Report | POST | /api/reports |
| Get Reports | GET | /api/reports |
| Add Vital | POST | /api/vitals |
| Get Vitals | GET | /api/vitals |

---

Made with ❤️ for better health management



