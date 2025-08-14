
<img src="/src/assets/logo-transparent.PNG" alt="Logo" width="300"> <br>
Tarkiz+ is a role-based teaching management platform built with React and Vite. It provides dashboards for teachers and administrators to manage students, lessons, schedules, and exams. Firebase handles authentication and Firestore storage, while i18next powers a multilingual interface (English, Arabic, and Hebrew). The project also ships with FastAPI microservices for the HelpBot assistant and the Tarkiz Compass feature. The platform is live and accessible at https://tarkizplus.onrender.com/.

## Features

- **Authentication & Authorization**  
  Firebase-based login with role-aware routes for teachers and admins.

- **Student & Teacher Management**  
  Add, edit, and view profiles, schedules, and subject specialties.

- **Lesson Log & Exam Tracking**  
  Create, edit, and review lesson entries and exam events.

- **Admin Dashboard**  
  Statistics, recent activity, and quick actions for platform oversight.

- **Multilingual UI**  
  i18next translations for English, Arabic, and Hebrew.

- **LLM-Powered Services**  
  HelpBot and Tarkiz Compass APIs (FastAPI + Together AI) for contextual assistance.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (for backend services)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```


## Backend Services

Located in `src/backend/`:

1. **Install Dependencies**
   ```bash
   cd src/backend
   pip install -r requirements.txt
   ```

2. **Run HelpBot API**
   ```bash
   uvicorn helpbot_api:app --reload
   ```

3. **Run Tarkiz Compass API**
   ```bash
   uvicorn tarkiz_compass_api:app --reload
   ```

## Project Structure

```
tarkizplus/
├─ public/                # Static assets
├─ src/
│  ├─ api/                # API utilities
│  ├─ assets/             # Images & icons
│  ├─ backend/            # FastAPI services
│  ├─ components/         # Reusable React components
│  ├─ firebase/           # Firebase config
│  ├─ localization/       # i18n setup and translations
│  ├─ pages/              # App pages
│  └─ styles/             # Tailwind styles
├─ index.html
├─ package.json
└─ vite.config.js
```

