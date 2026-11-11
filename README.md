# EduTrack AI — DATA SANA MEMORIAL SCHOOL

School attendance and information system for **Grades 9–12**, in **English and Amharic**.
Motto: *To seek · To serve · To know.*

It is a static website (works on **GitHub Pages**) plus an optional **Firebase** backend (free Spark plan, no Cloud Functions needed).

## Two modes

| Mode | When | Data |
|---|---|---|
| **Demo** | No `firebase-config.js` file | Sample data stored in the visitor's own browser only. Not shared between devices. |
| **Live** | `firebase-config.js` filled in | Real accounts (Firebase Authentication) and a shared database (Cloud Firestore). Devices stay in sync. |

The badge at the top right of the page shows which mode is running.

## Roles and rules

- **Director (Administrator)**: approves student applications, creates classes and teacher accounts, assigns homeroom teachers, posts announcements, views reports. The director **cannot** record attendance.
- **Teacher**: accounts are created **only by the administrator**. A teacher records attendance **only for their own assigned class(es)**, for today or up to 14 days back.
- **Student**: creates their own account and submits an application. They stay **pending** with no access until the administrator approves and assigns a class and student ID. Approved students see their own attendance only and cannot edit it.
- The **first administrator** is created manually by the project owner (see `docs/SETUP.md`). Nobody can choose their own role in the browser; permissions are enforced by `firestore.rules`, not by the page.

## Director AI assistant (voice + calculations)

Sign in as the Director and open **AI assistant**. Type a question, tap the quick-question chips, or tap the 🎤 microphone and speak. Examples:

- *How many students are there?* / *How many students are present today?*
- *Who is absent today in grade 10 A?* / *How many were absent yesterday?*
- *Attendance rate by class this week* / *Which classes have not taken attendance?*
- *Who is most absent this month?* / *Pending applications* / *Daily summary*
- *Calculate 45 + 30*, *15% of 200*, *12 out of 40 as a percent*
- Amharic works too, e.g. *ዛሬ ስንት ተማሪዎች ተገኝተዋል?*

Answers are **calculated from the school's real records** (the same data the Director can already see) by `assistant.js`, in the browser. No student data is sent to any AI service. Attendance rate = (present + late) ÷ students marked. Tick **Read answers aloud** to hear the answers.

Voice notes: speech recognition needs Chrome, Edge or Safari over **https** (your GitHub Pages link) or `localhost`, and microphone permission. In Chrome/Edge the audio is processed by the browser vendor's speech service. Amharic dictation depends on the browser; spoken Amharic answers need an Amharic voice installed on the device (otherwise the answer is shown on screen only). Teachers and students keep a simpler FAQ assistant that cannot read records.

## Try the demo (no setup)

Open `index.html` by double-clicking it, or serve the folder:

```bash
python -m http.server 8000     # then open http://localhost:8000
```

Demo access codes (demo mode only; they are visible in the code and are **not** real security):

| Portal | Code |
|---|---|
| Director (Administrator) | `DSMS-ADMIN-2026` |
| Teacher (Mr. Daniel) | `DSMS-TEACHER-2026` |
| Student (Abel Tesfaye) | `DSMS-STUDENT-2026` |

You can also use the **New student application** tab, then sign in as Administrator to approve it.

## Publish on GitHub Pages

1. Create a new repository on GitHub and upload **the contents of this folder** (so `index.html` is at the top level — do not upload the ZIP itself).
2. Repository **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`. Save.
3. After about a minute the site is live at `https://<your-user>.github.io/<repo-name>/`.
4. After later updates, hard-refresh the page (Ctrl+Shift+R) to bypass cached files.

The site starts in demo mode. To make it **live**, follow `docs/SETUP.md` (about 20 minutes, free).

## Project layout

```
index.html, styles.css, app.js     Interface (identical in both modes)
assistant.js                       Director data assistant (question understanding + calculations)
data-demo.js                       Demo data layer (browser-only)
data-firebase.js                   Live data layer (Firebase Auth + Firestore)
firebase-config.example.js         Copy to firebase-config.js and fill in
firestore.rules                    Security rules  <-- the real access control
firestore.indexes.json             Required database indexes
firebase.json                      Firebase CLI deployment config
sw.js, manifest.webmanifest        Installable app (PWA)
functions/                         OPTIONAL Cloud Functions (paid Blaze plan): server-side approval, custom claims, audit log
.github/workflows/                 OPTIONAL manual deploy workflows (GitHub Pages, Firestore rules)
docs/SETUP.md                      Step-by-step Firebase setup
```

## Security and privacy notes

- Demo mode must never be used with real student information.
- Live mode stores personal data (names, guardian phone numbers, attendance). Get the school's approval and follow Ethiopian and school data-protection requirements before use. Restrict who holds the Firebase project owner account and use a strong password with 2-step verification.
- Never commit a service-account key or Admin SDK private key. The Firebase *web* config in `firebase-config.js` is not secret.
- Have a qualified developer review `firestore.rules` before real data is entered, and test with separate admin, teacher and student accounts (checklist in `docs/SETUP.md`).

## How this relates to the original master specification

| Specification item | Status |
|---|---|
| Role-based portals, teacher-only attendance, director read-only, students see only their own | **Done** — enforced in `firestore.rules` |
| English + Amharic interface | **Done** (interface, FAQ and director assistant) |
| Voice assistant (speech in / speech out) for the director | **Done** (browser speech APIs) |
| Cloud-synced Firestore; no localStorage for school data | **Done in live mode.** `localStorage` is used only by demo mode, when no `firebase-config.js` exists |
| Roles set only by backend/admin approval | **Done** via rules (profile documents). Custom claims + audit log are available through the optional `functions/` (Blaze plan) |
| Real-time listeners / offline-first | **Not yet** — pages read fresh data each time they open; the PWA caches only the app shell |
| Notification bell, generative AI (RAG) | **Not yet** — the assistant is rule-based and works from live records |
| Folder layout `src/…` with many component files | Kept as a small flat layout (fewer files, easier to upload and maintain) |

## Known limitations

- The AI assistant answers a fixed list of school FAQs (English/Amharic). It does not read student records and is not a generative model yet.
- Teacher accounts get a temporary password set by the administrator; teachers change it with **Forgot password?**.
- No audit log, rate limiting or email verification yet. These need server-side code (Cloud Functions, Blaze plan) and are good next steps.
- Rejected or mistaken accounts must be removed manually in the Firebase console.
