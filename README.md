# PrepWise — AI-Powered Mock Interview Platform

PrepWise is a full-stack web application that lets candidates practice real-world job interviews with an AI voice agent. After each session, the platform automatically generates detailed performance feedback using Google Gemini.

---

## Features

- **AI Voice Interviews** — Conduct live voice interviews powered by [Vapi](https://vapi.ai) with a GPT-4-driven interviewer agent
- **Dynamic Question Generation** — Role, level, and tech-stack specific questions generated via Google Gemini
- **Automated Feedback** — Post-interview scoring across Communication, Technical Knowledge, Problem Solving, Cultural Fit, and Confidence
- **Authentication** — Secure sign-up / sign-in with Firebase Auth
- **Interview History** — View all past interviews and their feedback reports
- **Responsive UI** — Built with Tailwind CSS v4 and shadcn/ui components

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth & Database | Firebase Auth + Firestore |
| AI — Feedback | Google Gemini (`gemini-3-flash-preview`) via Vercel AI SDK |
| AI — Interview Agent | Vapi (voice) + OpenAI GPT-4 |
| Form Handling | React Hook Form + Zod |

---

## Project Structure

```
app/
├── (auth)/           # Sign-in and sign-up pages
├── (root)/           # Protected app pages
│   ├── page.tsx      # Dashboard — interview list
│   └── interview/
│       ├── page.tsx         # Create new interview
│       ├── [id]/page.tsx    # Live interview session
│       └── [id]/feedback/   # Post-interview feedback report
└── api/vapi/generate/       # Interview question generation endpoint

components/
├── Agent.tsx          # Voice interview session controller
├── AuthForm.tsx       # Shared sign-in / sign-up form
└── InterViewCard.tsx  # Interview summary card

lib/
├── actions/
│   ├── auth.action.ts     # Firebase Auth server actions
│   └── general.action.ts  # Feedback generation + Firestore queries
└── vapi.sdk.ts            # Vapi client instance

firebase/
├── admin.ts    # Firebase Admin SDK (server-side)
└── client.ts   # Firebase client SDK (browser-side)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com) project with Firestore and Authentication enabled
- A [Vapi](https://vapi.ai) account with a Web Token and Workflow ID
- A [Google AI Studio](https://aistudio.google.com) API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/prepwise.git
cd prepwise
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client (browser-side — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Vapi
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_vapi_workflow_id
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3001 |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Deployment

The easiest way to deploy is via [Vercel](https://vercel.com). Add all environment variables from `.env.local` to your Vercel project settings, then push to your main branch — Vercel will handle the rest.

```bash
npm run build   # Validate the build locally before deploying
```

---

## License

MIT
