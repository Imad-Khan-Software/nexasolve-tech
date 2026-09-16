# 🚀 NexaSolve Tech

<div align="center">

**Smart Code. Seamless Solutions.**

A modern web development platform and professional portfolio — built with React, Vite, Tailwind CSS, and Supabase.

[![Live Site](https://img.shields.io/badge/live-nexasolvetech.netlify.app-2ea44f?style=for-the-badge)](https://nexasolvetech.netlify.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Netlify Status](https://img.shields.io/netlify/YOUR-NETLIFY-BADGE-ID?style=for-the-badge&logo=netlify)](https://app.netlify.com/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

[🌐 Live Demo](https://nexasolvetech.netlify.app/) · [📖 Documentation](#-documentation) · [🐛 Report Bug](../../issues) · [✨ Request Feature](../../issues)

</div>

---

## 📸 Preview

<!-- Add real screenshots or a demo GIF here for maximum impact -->
<div align="center">
  <img src="./docs/screenshots/home.png" alt="Homepage preview" width="800" />
  <p><em>Landing page — Hero, Services, and Portfolio sections</em></p>
</div>

> 💡 Tip: A short demo GIF (using a tool like [Kap](https://getkap.co/) or [ScreenToGif](https://www.screentogif.com/)) at the top of a README dramatically increases engagement on GitHub and portfolios.

---

## 📑 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 📖 About

NexaSolve Tech is a full-stack platform combining a public-facing portfolio/marketing site with a client-management backend. Visitors can browse services and projects, submit enquiries, and track the progress of their commissioned work using a unique tracking code — while admins manage everything from a dedicated dashboard.

---

## ✨ Features

### 🌍 Public Website
- Modern, responsive landing page with smooth UI animations
- Hero, About, Skills & Technologies, and Services sections
- Portfolio showcase with **search and category filtering**
- Contact section and fully responsive navigation
- Mobile-first, cross-device design

### 📩 Client Enquiries
- Project enquiry form (name, email, project type, message)
- Database-backed submission via Supabase
- Auto-generated unique **tracking token** per enquiry

### 🔎 Project Tracking
Clients can follow their project's progress using a unique tracking code.
- Tracking code input + shareable URL support (`/track?track=YOUR_TRACKING_CODE`)
- Order/status information at a glance
- Two-way message thread for client follow-ups

### 🔐 Admin Dashboard
- Secure admin authentication (Supabase Auth)
- Project & order management
- Client messages and feedback management
- Profile management
- Analytics and visitor tracking

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, JavaScript, Tailwind CSS, HTML5, CSS3 |
| **Backend & Database** | Supabase, PostgreSQL, Supabase Auth, Supabase Realtime, Supabase RPC |
| **Tooling** | Git, GitHub, VS Code, Netlify |

---

## 📁 Project Structure

```text
nexasolve-tech/
│
├── public/                  # Static assets
│
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/                # Route-level page components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Supabase client, helpers, utilities
│   └── ...
│
├── supabase/
│   └── migrations/           # SQL migration files
│
├── personal-brand/           # Personal portfolio module
│
├── .env.example               # Sample environment variables
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm / yarn / pnpm
- A [Supabase](https://supabase.com/) account and project

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/nexasolve-tech.git
cd nexasolve-tech

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# then fill in your Supabase credentials (see below)

# 4. Run the development server
npm run dev
```

The app should now be running at `http://localhost:5173`.

---

## 🔑 Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> ⚠️ Never commit your `.env` file. `.env.example` should only contain placeholder values.

---

## 🗄️ Database Setup

1. Create a new project on [Supabase](https://supabase.com/).
2. Link your local project to Supabase:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
3. Apply the migrations found in `supabase/migrations/`:
   ```bash
   npx supabase db push
   ```
4. Set up Row Level Security (RLS) policies for `enquiries`, `orders`, `messages`, and `admin` tables as defined in your migrations.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

---

## 🌐 Deployment

This project is deployed on **Netlify**.

1. Push your changes to the `main` branch.
2. Netlify auto-builds using:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Add your environment variables in **Netlify → Site settings → Environment variables**.

**Live site:** [nexasolvetech.netlify.app](https://nexasolvetech.netlify.app/)

---

## 🗺️ Roadmap

- [ ] Email notifications for new enquiries
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Client dashboard (beyond tracking page)
- [ ] Automated testing (unit + e2e)

> Feel free to open an issue to suggest more.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please make sure to update tests and documentation as appropriate.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

**NexaSolve Tech**

- 🌐 Website: [nexasolvetech.netlify.app](https://nexasolvetech.netlify.app/)
- 📧 Email: your-email@example.com
- 💼 LinkedIn: [your-linkedin](https://linkedin.com/in/your-profile)
- 🐙 GitHub: [@your-username](https://github.com/your-username)

<div align="center">

If you find this project useful, consider giving it a ⭐!

</div>
