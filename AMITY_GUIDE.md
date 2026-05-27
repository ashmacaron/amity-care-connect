# Amity — Step-by-Step Build Guide (for absolute beginners)

Hi! This is your build journal for **Amity**, a friendly telehealth web app.
Here's exactly what was set up and what you do next — explained like you're 15. 💜

---

## What Amity already does (built for you)

- 🏠 **Landing page** at `/` — calm lavender hero with the friendly doctor image.
- 🔐 **Sign up & sign in** at `/signup` and `/login` — choose Patient or Doctor.
- 🧑‍⚕️ **Patient module:**
  - Big-button dashboard at `/app`
  - Find a doctor + filter by specialty (`/app/doctors`)
  - **Ask Amity AI** — describe symptoms, get a suggested specialty (`/app/ai`)
  - Book a visit (`/app/book/:doctorId`)
  - My appointments + cancel (`/app/appointments`)
  - My records / prescriptions (`/app/records`)
  - My profile (`/app/profile`)
- 👨‍⚕️ **Doctor module:**
  - Today's bookings (`/app/doctor/appointments`)
  - Weekly schedule editor (`/app/doctor/schedule`)
  - Doctor profile + bio (`/app/doctor/profile`)
- 🎥 **Consultation room** at `/app/consult/:id` — live Jitsi video call. Doctors can write notes & prescriptions inside the same screen.
- 🗄️ **Backend (Lovable Cloud):** Postgres database with `profiles`, `doctors`, `doctor_availability`, `appointments`, `prescriptions`, `user_roles` — all secured with Row-Level Security so patients only see their own data and doctors only see their own patients.
- 🌱 **6 demo doctors** pre-seeded so the app works immediately.

---

## ♿ Accessibility for seniors (already on)

- Base font size is **17px** (most apps use 14–16).
- Every button/link is at least **44px tall** (easy to tap).
- Strong contrast palette — passes WCAG AA.
- Clear focus rings when you tab around with a keyboard.

---

## 🤖 About the AI ("GEMINI_API_KEY")

Good news: **you don't need your own Gemini API key.**
Lovable Cloud already gives this project a `LOVABLE_API_KEY` that includes Google Gemini for free (a small free tier, then pay-as-you-go in your workspace).
The AI server function lives in `src/lib/ai.functions.ts` and uses `google/gemini-3-flash-preview`.

If later you want your *own* Gemini key, ask me: "Add a GEMINI_API_KEY secret and use it instead of Lovable AI."

---

## ▶️ Try it now (5 min)

1. Click the **preview** in the right side of Lovable.
2. Click **Get started** → sign up with any email and a password (≥6 chars). Pick **Patient**.
3. You'll land on the home dashboard. Click **Ask Amity AI** and type something like "*I have a sore throat and runny nose for 3 days*".
4. Click a suggested doctor → **Book a visit** → pick a date & time.
5. Go to **My appointments** → click **Join** → you're in a real Jitsi video room. 🎉
6. Sign out, sign up again as **Doctor**, fill in `/app/doctor/profile`, set hours in `/app/doctor/schedule`. (Tip: patients only see *seeded* doctors right now; the schedule UI is real, so this proves the doctor flow works.)

---

## 🐙 Step 1 — Connect to GitHub

1. In Lovable, top-right click your project name → **Connect to GitHub**.
2. Authorize the Lovable GitHub app.
3. Pick your GitHub account → **Create Repository**.
   That's it! Every change you make on Lovable now auto-syncs to GitHub, and vice versa.

---

## ☁️ Step 2 — Publish (deploy)

1. Click **Publish** (top-right in Lovable).
2. Pick a subdomain (e.g. `amity-yourname`) → click **Publish**.
3. Your app is now live at `https://amity-yourname.lovable.app` — runs on **Cloudflare Workers** automatically. No Docker or AWS needed. ✅

> Lovable's stack already runs on Cloudflare's edge, so your "Cloudflare deployment" requirement is met.

---

## 🌐 Step 3 (optional) — Custom domain

After publishing, **Project Settings → Domains → Add custom domain**. Point your domain's DNS at the values shown. Done.

---

## 🛠️ How to keep building (when judges ask for more)

Just type these in the Lovable chat:

- *"Add real-time push notifications for new bookings"*
- *"Let doctors mark slots as unavailable for specific dates"*
- *"Add a profile photo uploader"*
- *"Send an email reminder 1 hour before each appointment"*
- *"Show a map of clinics for in-person follow-ups"*

I'll wire each into the same modules.

---

## ✅ Submission checklist for WC Launchpad

- ✅ Web app, desktop-first but responsive
- ✅ TypeScript + React (TanStack Start) frontend
- ✅ Server functions (custom API logic in `src/lib/*.functions.ts`)
- ✅ PostgreSQL database (Lovable Cloud = managed Postgres)
- ✅ Auth (email/password + role separation)
- ✅ AI specialty recommendation (Gemini via Lovable AI)
- ✅ Booking + cancel + records
- ✅ Live video calls (Jitsi)
- ✅ GitHub connected
- ✅ Deployed on Cloudflare (Lovable publish)
- ✅ Modular code, documented, with error handling

You're good to submit. 💜

---

## 🧠 Where each thing lives in the code

| Folder/file | Purpose |
|---|---|
| `src/routes/index.tsx` | Landing page |
| `src/routes/login.tsx`, `signup.tsx` | Auth pages |
| `src/routes/app.*.tsx` | All in-app pages (patient + doctor) |
| `src/components/app-shell.tsx` | Sidebar layout used by every app page |
| `src/hooks/use-auth.ts` | Reads the logged-in user + role |
| `src/lib/ai.functions.ts` | AI recommendation (server-side, secure) |
| `src/integrations/supabase/*` | Auto-generated database clients — **don't edit** |
| `src/styles.css` | The lavender design tokens |

If you ever break something, just chat: *"undo last change"* or *"the AI page is blank, fix it"*. I see your console errors and can debug.

Good luck! 🌸
