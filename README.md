# Digital Health Wallet 💊

A comprehensive digital health records management system that enables users to store, track, and share their medical reports and vitals securely.

![Health Wallet](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![SQLite](https://img.shields.io/badge/SQLite-3.x-lightblue.svg)

## 🚀 Features

- **User Authentication** - Secure registration and login with JWT tokens
- **Medical Report Management** - Upload, view, and download PDF/image reports
- **Vitals Tracking** - Record and monitor health vitals over time with trend charts
- **Report Sharing** - Share reports with doctors, family, and friends with read-only access
- **Search & Filter** - Find reports by date, type, and keywords
- **Modern UI** - Beautiful dark theme with glassmorphism design

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Chart.js, React Router |
| Backend | Node.js, Express.js |
| Database | SQLite3 |
| Authentication | JWT, bcrypt |
| File Upload | Multer |

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  React Frontend                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ │
│  │  │ Dashboard│ │ Reports  │ │  Vitals  │ │ Sharing  │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │ │
│  │                      │                                   │ │
│  │           ┌──────────┴──────────┐                       │ │
│  │           │  Context API State  │                       │ │
│  │           └──────────┬──────────┘                       │ │
│  └──────────────────────│──────────────────────────────────┘ │
└──────────────────────────│──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────│──────────────────────────────────┐
│                     BACKEND SERVER                           │
│  ┌──────────────────────│──────────────────────────────────┐ │
│  │              Express.js + Middleware                     │ │
│  │  ┌─────────────────────────────────────────────────────┐│ │
│  │  │ CORS │ JSON Parser │ JWT Auth │ Multer (uploads)   ││ │
│  │  └─────────────────────────────────────────────────────┘│ │
│  │                          │                               │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┐          │ │
│  │  │  Auth   │ Reports  │  Vitals  │ Sharing  │  Routes │ │
│  │  └──────────┴──────────┴──────────┴──────────┘          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                          │                                    │
│  ┌──────────────────────│──────────────────────────────────┐ │
│  │              SQLite Database                             │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │ │
│  │  │  Users  │ │ Reports │ │ Vitals  │ │ SharedAccess │  │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │          Local File Storage (/uploads)                    │ │
│  │     PDFs and Images organized by user ID                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 📦 Installation & Setup

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/digital-health-wallet.git
cd digital-health-wallet
```

### 2. Backend Setup

```bash
cd BACKEND
npm install
npm start
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd "FRONTEND "
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

## 📊 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    report_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    report_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Vitals table
CREATE TABLE vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    vital_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    recorded_at DATETIME NOT NULL,
    notes TEXT,
    report_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Shared access table
CREATE TABLE shared_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    shared_with_id INTEGER NOT NULL,
    access_type TEXT DEFAULT 'read',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (shared_with_id) REFERENCES users(id)
);
```

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

Response:
```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "email": "john@example.com",
        "name": "John Doe"
    }
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

---

### Reports

#### Upload Report
```http
POST /reports
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF or Image file>
title: "Blood Test Results"
report_type: "Blood Test"
report_date: "2024-01-15"
notes: "Annual checkup"
```

#### Get All Reports
```http
GET /reports?report_type=Blood Test&start_date=2024-01-01&end_date=2024-12-31&search=annual
Authorization: Bearer <token>
```

#### Get Single Report
```http
GET /reports/:id
Authorization: Bearer <token>
```

#### Download Report File
```http
GET /reports/:id/download
Authorization: Bearer <token>
```

#### Delete Report
```http
DELETE /reports/:id
Authorization: Bearer <token>
```

---

### Vitals

#### Add Vital
```http
POST /vitals
Authorization: Bearer <token>
Content-Type: application/json

{
    "vital_type": "Blood Pressure",
    "value": 120,
    "unit": "mmHg",
    "recorded_at": "2024-01-15T10:30:00",
    "notes": "Morning reading"
}
```

#### Get All Vitals
```http
GET /vitals?vital_type=Blood Pressure&start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

#### Get Vitals Trends
```http
GET /vitals/trends?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

Response:
```json
[
    {
        "type": "Blood Pressure",
        "unit": "mmHg",
        "data": [
            { "value": 120, "date": "2024-01-15T10:30:00" },
            { "value": 118, "date": "2024-01-16T10:30:00" }
        ]
    }
]
```

#### Get Latest Vitals
```http
GET /vitals/latest
Authorization: Bearer <token>
```

#### Delete Vital
```http
DELETE /vitals/:id
Authorization: Bearer <token>
```

---

### Sharing

#### Share Report
```http
POST /share
Authorization: Bearer <token>
Content-Type: application/json

{
    "report_id": 1,
    "shared_with_email": "doctor@example.com"
}
```

#### Get Reports Shared With Me
```http
GET /share/shared-with-me
Authorization: Bearer <token>
```

#### Get My Shares
```http
GET /share/my-shares
Authorization: Bearer <token>
```

#### Revoke Access
```http
DELETE /share/:id
Authorization: Bearer <token>
```

---

## 🔐 Security Considerations

| Aspect | Implementation |
|--------|----------------|
| **Password Storage** | Passwords hashed with bcrypt (10 salt rounds) |
| **Authentication** | JWT tokens with 24-hour expiry |
| **API Protection** | Bearer token required for protected routes |
| **File Validation** | Only PDF, JPG, PNG allowed (10MB max) |
| **Access Control** | Users can only access own data or explicitly shared reports |
| **CORS** | Configured for frontend origin only |

## 📁 Project Structure

```
DIGITAL HEALTH WALLET/
├── BACKEND/
│   ├── config/
│   │   └── database.js      # SQLite initialization
│   ├── middleware/
│   │   └── auth.js          # JWT verification
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── reports.js       # Report CRUD routes
│   │   ├── vitals.js        # Vitals routes
│   │   └── sharing.js       # Sharing routes
│   ├── uploads/             # File storage
│   ├── package.json
│   └── server.js            # Express entry point
│
├── FRONTEND /
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Sharing.jsx
│   │   │   └── Vitals.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🎯 Supported Vital Types

- Blood Pressure (mmHg)
- Heart Rate (bpm)
- Blood Sugar (mg/dL)
- Weight (kg)
- Temperature (°C)
- Oxygen Level (%)

## 📋 Supported Report Types

- Blood Test
- X-Ray
- MRI
- CT Scan
- Ultrasound
- ECG
- Prescription
- Lab Report
- Other

## 🔄 Future Enhancements

- [ ] WhatsApp integration for report uploads
- [ ] Mobile app (React Native)
- [ ] Cloud file storage (AWS S3)
- [ ] Two-factor authentication
- [ ] Report OCR for automatic vital extraction
- [ ] Email notifications for shared reports
- [ ] Export health data to PDF

## 📄 License

MIT License - feel free to use this project for learning and personal use.

---

Built with ❤️ for better health management
