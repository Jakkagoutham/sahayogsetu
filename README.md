# SahayogSetu (सहयोग सेतु) — Smart India Hackathon Working Prototype

> **A digital platform connecting citizens, university student innovators, and government authorities to crowdsource and solve societal challenges.**

Built specifically for the **Smart India Hackathon (SIH)** submission stage. Features real-time **Groq AI** triage, autonomous solution scoring against the **official 6-parameter government weightage matrix (100 points)**, strict **administrative SLA timelines**, **GPS ground-proof photo verification**, **citizen privacy guarantee (zero personal data)**, and **cross-locality problem intelligence**.

---

## 🌟 Key Features

### 1. Citizen Problem Reporting (100% Privacy Protected)
- **Zero Personal Details**: Citizens report challenges without providing names, phone numbers, or email addresses.
- **GPS Photo Proof Verification**: Prompts citizens to upload photos captured with GPS camera apps.
- **Metadata Extraction & Authenticity Check**: Client & server parse EXIF geotags (latitude, longitude) and inspect for synthetic AI artifacts.
- **Autonomous Groq AI Triage**: Groq `llama-3.1` categorizes the problem (Water, Roads, Health, Agriculture, Sanitation, Education, Infrastructure, Other), assigns urgency (High, Medium, Low), sets the administrative level, and establishes the official SLA timeline.

### 2. Official 6-Parameter Solution Evaluation Matrix (Table 1)
Every student/university solution is scored by Groq AI out of **100 Points**:
| Parameter | Weightage | Description |
| :--- | :---: | :--- |
| **Resolution Rate** | **30** | Effectiveness in fixing the root cause |
| **Average Closure Time** | **20** | Realistic execution speed relative to administrative SLA |
| **Citizen Satisfaction Score** | **20** | Tangible relief and public benefit |
| **Escalation Percentage** | **10** | Prevention of escalation to higher administrative tiers |
| **Reopened Cases** | **10** | Durability, maintenance feasibility, and permanent fix |
| **Innovation & Best Practices** | **10** | Frugal engineering, IoT telemetry, eco-friendly materials |
| **Total Score** | **100** | **Comprehensive AI Merit Index** |

### 3. Administrative Level SLAs & Automatic Escalation (Table 2)
| Administrative Level | Maximum Resolution Time |
| :--- | :---: |
| **Village / Ward** | **7 Days** |
| **Mandal** | **15 Days** |
| **District** | **30 Days** |
| **State** | **Special Review** |

*Note: Automatic escalation occurs when timelines are exceeded, triggering an alert badge on the public board.*

### 4. Cross-Locality & Duplicate Intelligence
- **Locality Duplicate Detection**: Alerts submitters if an identical issue was already reported in their village/mandal, linking them together.
- **Cross-State Similar Challenges**: Shows how other states (e.g. Maharashtra vs. Uttar Pradesh vs. Telangana) are tackling the same underlying issue.
- **Re-use Proven Solutions**: Highlights successful solutions from similar past challenges to prevent reinventing the wheel.

### 5. Authority-to-Team Connect (No Separate Login Needed)
- Government authorities view top-ranked solutions directly on the public problem board.
- Clicking **"Contact Team / View Credentials"** opens the authority connect modal displaying:
  - Team Name & Institution (University/College)
  - Team Lead Name, Official Email, and Phone Number
  - Proposed Budget & Implementation Timeline
  - Action button to **Initiate Official Pilot Sanction / MoU**.

---

## 🛠️ Tech Stack

- **Frontend**: React.js 18, Vite, Lucide React icons, Tailwind-inspired Vanilla CSS design system with glassmorphism and Indian tricolor accents.
- **Backend**: Node.js, Express.js, CORS, Multer, Exif-Parser.
- **Database**: Pure JSON file-based database (`backend/data/problems.json` and `solutions.json`) with atomic writes, pre-loaded with realistic SIH seed challenges across India.
- **AI Engine**: Groq Cloud SDK (`llama-3.1` / `qwen3.8-27b`) with fallback resilience.

---

## 🚀 How to Run Locally (Single Command)

### Prerequisites
- Node.js (v18+) and npm installed.

### Step 1: Run the Platform
Open a terminal in the project root (`sahayog-setu`) and run:
```bash
npm run dev
```

This single command starts:
1. **Express Backend API** on `http://127.0.0.1:5000`
2. **Vite Frontend Dev Server** on `http://127.0.0.1:5173` (with automatic `/api` proxy)

Open your browser and navigate to:
```
http://127.0.0.1:5173
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/problems` | List problems with search, category, level, and urgency filters |
| `POST` | `/api/problems` | Submit challenge with photo proof, runs Groq AI triage & duplicate check |
| `GET` | `/api/problems/:id` | Full details, sorted solutions, SLA countdown, and cross-state matches |
| `POST` | `/api/problems/:id/solutions`| Submit university solution, runs 6-parameter Groq AI evaluation (100 pts) |
| `POST` | `/api/solutions/:id/upvote` | Upvote a student solution |

---

## 🏆 SIH Hackathon Demo Walkthrough

1. **Explore Problem Board**: Filter by **Category** (Water, Roads, Health) and **Administrative Level** (Village, Mandal, District).
2. **Inspect SLA Tracking**: Notice the countdown timer on each card and the **Escalated** warning on overdue problems.
3. **Open Evaluation Matrix**: Click **"Evaluation Matrix"** in the top navbar to show judges the official 6-parameter weightage and SLA timeline tables.
4. **Drill into Top Solution**: Click a problem card to see the **#1 AI-Ranked Solution** highlighted in gold with the full 100-point breakdown.
5. **Demonstrate Authority Connect**: Click **"Contact Team / View Credentials"** to show how government officers can directly reach the university team.
6. **Submit a New Challenge**: Go to **"Report Problem"**, test the GPS photo guidance prompt, see that **zero citizen personal data** is asked, and witness Groq AI auto-classify category, urgency, and SLA in real-time!
