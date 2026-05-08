# LetsHuddle

A next-generation task and huddle management platform built with React, Firebase, and Neon PostgreSQL.

## Overview

LetsHuddle helps teams organize tasks, schedule them into focused work sessions called "Huddles," track completion, and move unfinished tasks between huddles — all with a clean, modern, responsive UI.

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Personalized task overview with stats, filters, and due-date indicators |
| **Task Master** | Full CRUD for tasks with status, assignments, due dates, and document uploads |
| **Huddle Master** | Full CRUD for huddles with location, day/date, and status tracking |
| **HuddleUp** | Assign tasks to huddles, move incomplete tasks between huddles |
| **Documents** | View all uploaded documents across tasks |
| **Users & Admin** | Role-based access management (Admin / Manager / User) |
| **Settings** | Profile management and account info |

### Business Rules

- A Huddle cannot be marked **Completed** unless all assigned tasks are completed
- Incomplete tasks can be moved between huddles freely
- Completed tasks remain locked from movement unless reopened
- Users only see tasks assigned to them; admins and managers see all

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Auth | Firebase Authentication (email/password + Google) |
| Database (primary) | Firestore (NoSQL) |
| Database (analytics) | Neon PostgreSQL (serverless) |
| File Storage | Firebase Storage |
| Backend API | Firebase Functions (Node.js 20) |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions + Firebase Preview Channels |

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- A Neon PostgreSQL database ([neon.tech](https://neon.tech))

### 2. Firebase Setup

In your Firebase project, enable:
- **Authentication** → Email/Password and Google providers
- **Firestore** → Create database in production mode
- **Storage** → Default bucket
- **Hosting** → Enable

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Install and Run

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

### 5. Deploy Firestore Rules and Indexes

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
```

---

## Neon PostgreSQL Setup

1. Create a project at [neon.tech](https://neon.tech)
2. Copy your connection string
3. Apply the schema:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

4. Set the connection string in Firebase Functions config:

```bash
firebase functions:config:set neon.database_url="postgresql://..."
```

---

## Firestore Data Model

```
users/{uid}
  email, displayName, photoURL, role, createdAt, updatedAt

tasks/{taskId}
  name, description, assignedUserId, assignedUserName,
  dueDate, status, documentIds[], createdAt, updatedAt, createdBy

huddles/{huddleId}
  name, day, date, location, status, createdAt, updatedAt, createdBy

huddleTasks/{huddleTaskId}
  huddleId, taskId, order, addedAt, addedBy

documents/{documentId}
  taskId, name, url, size, type, storagePath, uploadedAt, uploadedBy

auditLogs/{logId}
  entityType, entityId, action, previousValue, newValue,
  performedBy, performedAt
```

---

## CI/CD — Firebase Preview Channels

Every pull request to `main` or `develop` automatically deploys to a Firebase Hosting Preview Channel and posts the preview URL as a PR comment.

Merging to `main` triggers a production deployment.

### GitHub Secrets Required

| Secret | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

Generate the service account: Firebase Console → Project Settings → Service Accounts → Generate new private key.

---

## Role-Based Access Control

| Role | Tasks | Huddles | Users |
|---|---|---|---|
| **Admin** | All tasks (CRUD) | All huddles (CRUD) | Manage roles |
| **Manager** | All tasks (CRUD) | All huddles (CRUD) | View only |
| **User** | Own tasks only | View all | — |

---

## Project Structure

```
LetsHuddle/
├── src/
│   ├── components/
│   │   ├── layout/       # AppLayout, Sidebar, MobileHeader
│   │   └── ui/           # Button, Card, Modal, Badge, Toast, etc.
│   ├── contexts/         # AuthContext
│   ├── lib/              # Firebase initialization
│   ├── pages/            # All route-level pages
│   ├── services/         # Firestore service functions
│   ├── types/            # TypeScript types and constants
│   └── utils/            # cn() utility
├── functions/            # Firebase Functions (Node.js 20)
│   └── src/index.ts      # Firestore triggers + HTTP APIs
├── database/
│   ├── schema.sql        # Neon PostgreSQL schema and views
│   └── seed.sql          # Demo seed data
├── .github/workflows/    # CI/CD pipelines
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── storage.rules
```

---

## Mobile Support

The responsive layout targets mobile-first via Tailwind CSS breakpoints. For native iOS/Android, the same Firebase backend and Neon database can be consumed using React Native with `@react-native-firebase/app` or Flutter with `cloud_firestore`.

---

## License

MIT
