# InterviewIQ — Local-First AI Technical Interview Platform

> **"We don't just test what you know. We investigate how deeply you understand it."**

InterviewIQ is a voice-first, evidence-based technical interview preparation platform built for Computer Science students, freshers, internship seekers, and software engineering candidates. 

Unlike generic chatbots that ask static questions, InterviewIQ investigates candidates' technical claims in real-time by correlating three sources of evidence: **their uploaded resume**, **their spoken answers**, and **target role engineering standards**.

---

## 🌟 Key Features

### 1. Evidence-Based Adaptive Interviewing (Core USP)
- **Claim Investigation:** When a candidate says *"I used Redux"*, InterviewIQ doesn't jump to an unrelated topic. It dynamically probes:
  - *Why Redux over React Context API?*
  - *How did you structure state and avoid unnecessary re-renders?*
  - *How were asynchronous side effects and race conditions handled?*
- **Evidence Tracking:** Records every technical concept with its source, verbal evidence demonstrated, follow-up count, evaluation confidence, and depth rating.
- **Scientific Classification:** Classifies knowledge into **Demonstrated**, **Partially demonstrated**, **Requires Assessment**, or **Not demonstrated**.

### 2. Evidence-Based Skill Gap Map
- Generates a visual map comparing **Claimed Skills** (from your resume or profile) against **Demonstrated Skills** (rigorously proven during questioning with trade-offs).
- Prominently visible on the Dashboard and in the final Performance Report.

### 3. Voice-First Technical Interaction
- Candidate speaks answers through their microphone using browser-native SpeechRecognition (`webkitSpeechRecognition`).
- AI interviewer speaks questions aloud using browser-native SpeechSynthesis.
- Full interview controls: Start, Pause, Resume, Repeat question, Re-record, and End session.
- Real-time spoken transcript review before submission. No typing allowed.

### 4. Resume RAG & Deep Competency Extraction
- Upload PDF resumes (stored safely in local `uploads/`).
- Gemini extracts projects, technologies, and **investigation hooks**.
- Text chunking and embedding storage for retrieval during questioning.

### 5. Curated Question Bank (14 Engineering Categories)
- JavaScript, React, Node.js, Java, Python, DSA, OOP, DBMS, Operating Systems, Computer Networks, SQL, System Design, HR, and Behavioral.
- Filter by category, difficulty (Beginner, Intermediate, Advanced), search keywords, and bookmark questions.

### 6. Comprehensive Performance Reports & Analytics
- Weighted scores: Technical Correctness, Reasoning & Depth, and Communication Clarity.
- Question-wise evaluations with high-caliber model answers.
- Personalized engineering learning plan with prioritized action items.
- Recharts-powered progression charts over time.
- One-click PDF report export.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts, Lucide React icons.
- **Backend:** Node.js, Express.js, REST APIs, Multer, `pdf-parse`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`.
- **Database:** PostgreSQL Community Edition via native `pg` driver, parameterized SQL queries, schema DDL, and question bank seed.
- **AI Engine:** Google Gemini API via official `@google/genai` JavaScript SDK (model: `gemini-3.8-flash`).
- **Voice APIs:** Browser-native SpeechRecognition & SpeechSynthesis.

---

## 📁 Project Structure

```
InterviewIQ/
├── backend/
│   ├── db.js                     # PostgreSQL connection pool & dual-mode fallback
│   ├── gemini.js                 # Gemini AI SDK (adaptive questioning & evaluations)
│   ├── middleware/
│   │   └── auth.js               # JWT & HttpOnly cookie verification
│   └── routes/
│       ├── auth.js               # Sign up, sign in, logout, me
│       ├── resumes.js            # PDF upload, parsing, Gemini extraction, RAG
│       ├── interviews.js         # Interview lifecycle & state
│       ├── questions.js          # Spoken answer processing & adaptive follow-ups
│       ├── reports.js            # Comprehensive report retrieval
│       ├── questionBank.js       # 14 categories, search & bookmarks
│       └── analytics.js          # Score progression & skill breakdown
├── database/
│   ├── schema.sql                # Complete 12-table PostgreSQL DDL & indexes
│   └── seed.sql                  # Curated questions across 14 categories
├── src/
│   ├── context/
│   │   └── AuthContext.jsx       # Authentication state provider
│   ├── components/
│   │   ├── Navbar.jsx            # Editorial header & navigation
│   │   ├── AudioWave.jsx         # Visual sound wave & speech state equalizer
│   │   ├── SkillGapMap.jsx       # Visual Claimed vs Demonstrated skill map
│   │   └── ProductExplainerModal.jsx # USP architecture & workflow explanation
│   ├── pages/
│   │   ├── AuthPage.jsx          # First screen: Clean Sign In & Sign Up
│   │   ├── Dashboard.jsx         # Welcome, stats, Skill Map, recent sessions
│   │   ├── InterviewSetupModal.jsx # Role, difficulty, & resume configuration
│   │   ├── ActiveInterview.jsx   # 100% voice interview & live transcription
│   │   ├── InterviewReport.jsx   # Detailed grading, evaluations, & PDF export
│   │   ├── ResumeManager.jsx     # PDF upload, RAG chunks & extracted profile
│   │   ├── QuestionBank.jsx      # Curated questions across 14 categories
│   │   ├── InterviewHistory.jsx  # Past sessions & score archives
│   │   └── Analytics.jsx         # Recharts score trends & skill bars
│   ├── App.tsx                   # Main router & application controller
│   └── index.css                 # Editorial warm design system & theme tokens
├── tests/
│   └── backend.test.js           # Full backend & database test suite
├── uploads/                      # Local resume storage directory
├── .env.example                  # Environment configuration template
├── README.md                     # This file
├── SETUP_LOCAL.txt               # Exhaustive beginner-friendly local setup guide
└── server.ts                     # Full-stack dev & production server
```

---

## 🚀 Quick Start (Local Setup)

> **Important:** For step-by-step instructions with PostgreSQL installation commands and free Gemini API key setup, please read [`SETUP_LOCAL.txt`](./SETUP_LOCAL.txt).

### 1. Configure Environment
Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```
Add your free Gemini API key from [Google AI Studio](https://aistudio.google.com/) and your local PostgreSQL credentials.

### 2. Set Up Database (PostgreSQL)
Run the SQL schema and seeds:
```bash
psql -U postgres -c "CREATE DATABASE interviewiq;"
psql -U postgres -d interviewiq -f database/schema.sql
psql -U postgres -d interviewiq -f database/seed.sql
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Application
```bash
npm run dev
```

Open **Google Chrome** on desktop and navigate to:
```
http://localhost:3000
```

### 5. Run Automated Tests
```bash
npm test
```

---

## 🔒 Privacy & Free-First Architecture

- **Zero Cloud Storage Fees:** All resumes and database records stay entirely on your local computer.
- **Zero Third-Party Tracking:** No Google/social OAuth trackers; authentication is verified against your local PostgreSQL.
- **Free Google Gemini API:** Uses standard free developer quotas from Google AI Studio.

---

## 📄 License
Apache-2.0
