# 🚀 NexaSolve Tech

<div align="center">

**Smart Code. Seamless Solutions.**

A modern web development platform and professional portfolio built with **React, Vite, Tailwind CSS, and Supabase**.

[![Live Site](https://img.shields.io/badge/Live-nexasolvetech.netlify.app-2ea44f?style=for-the-badge)](https://nexasolvetech.netlify.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge\&logo=supabase\&logoColor=white)](https://supabase.com/)

[🌐 Live Demo](https://nexasolvetech.netlify.app/) · [📂 GitHub Repository](https://github.com/Imad-Khan-Software/nexasolve-tech)

</div>

---

## 📖 About

**NexaSolve Tech** is a full-stack web development platform and professional portfolio.

The platform combines a modern public-facing website with a Supabase-powered backend and administrative system.

Visitors can explore services and projects, submit project enquiries, and track their enquiries using a unique tracking code.

The project was built to provide a professional digital presence while also demonstrating practical experience with modern frontend development, backend integration, authentication, database management, realtime communication, and analytics.

---

## ✨ Features

### 🌍 Public Website

* Modern responsive landing page
* Hero section
* About section
* Skills and technologies
* Services
* Portfolio projects
* Project search
* Category filtering
* Contact section
* Responsive navigation
* Mobile-friendly design
* Modern UI animations

### 📩 Client Enquiries

* Project enquiry form
* Client information collection
* Project selection
* Message submission
* Supabase database integration
* Unique tracking token generation

### 🔎 Project Tracking

Clients can track their enquiry using a unique tracking code.

* Tracking code input
* Shareable tracking URLs
* Order information
* Project status
* Client message thread
* Follow-up messaging

Example:

```text
/track?track=YOUR_TRACKING_CODE
```

### 🔐 Admin Dashboard

The platform includes an administrative system for managing projects and client activity.

* Admin authentication
* Project management
* Order management
* Client messages
* Feedback management
* Profile management
* Analytics
* Visitor tracking

---

## 🛠️ Tech Stack

| Layer                  | Technologies                                       |
| ---------------------- | -------------------------------------------------- |
| **Frontend**           | React, Vite, JavaScript, Tailwind CSS, HTML5, CSS3 |
| **Backend**            | Supabase                                           |
| **Database**           | PostgreSQL                                         |
| **Authentication**     | Supabase Auth                                      |
| **Realtime**           | Supabase Realtime                                  |
| **Database Functions** | Supabase RPC                                       |
| **Deployment**         | Netlify                                            |
| **Version Control**    | Git & GitHub                                       |
| **Development**        | VS Code                                            |

---

## 📁 Project Structure

```text
nexasolve-tech/
│
├── public/                     # Static assets
│
├── src/
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Application pages
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Supabase client and utilities
│   └── ...
│
├── supabase/
│   └── migrations/             # Database migration files
│
├── personal-brand/             # Personal branding resources
│
├── .env.example                # Environment variable template
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

* Node.js 18 or higher
* npm
* A Supabase account and project
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/Imad-Khan-Software/nexasolve-tech.git
```

### 2. Enter the Project

```bash
cd nexasolve-tech
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root based on `.env.example`.

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> ⚠️ Never commit your `.env` file or private credentials to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## 🗄️ Supabase Integration

NexaSolve Tech uses Supabase for backend functionality including:

* PostgreSQL database
* Authentication
* Realtime communication
* Project management
* Client enquiries
* Orders
* Messages
* Feedback
* Analytics
* Visitor tracking
* Database functions / RPC

Database migrations are maintained inside:

```text
supabase/migrations/
```

---

## 📜 Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the development server         |
| `npm run build`   | Build the application for production |
| `npm run preview` | Preview the production build         |
| `npm run lint`    | Run ESLint checks                    |

---

## 🌐 Main Routes

| Route    | Description                   |
| -------- | ----------------------------- |
| `/`      | Public NexaSolve Tech website |
| `/admin` | Administrative dashboard      |
| `/track` | Client project tracking       |
| `*`      | 404 page                      |

---

## 🚀 Deployment

The production website is deployed using **Netlify**.

### Build Command

```bash
npm run build
```

### Publish Directory

```text
dist
```

Environment variables should be configured through the deployment platform rather than committed to the repository.

### Live Website

https://nexasolvetech.netlify.app/

---

## 🎯 Project Goals

NexaSolve Tech was created to:

* Build a professional developer brand
* Showcase real-world web applications
* Provide a platform for client enquiries
* Allow clients to track project communication
* Practice production-level React development
* Integrate React applications with Supabase
* Develop experience with authentication and databases
* Implement realtime communication
* Practice analytics and visitor tracking
* Create a foundation for future web development services

---

## 🗺️ Roadmap

Future improvements may include:

* [ ] Email notifications for new enquiries
* [ ] Advanced admin analytics
* [ ] Improved client communication
* [ ] Client dashboard
* [ ] Multi-language support
* [ ] Enhanced authentication security
* [ ] Automated testing
* [ ] Further performance optimization
* [ ] Enhanced SEO
* [ ] Additional automation features

---

## 👨‍💻 Author

**Imad Khan**

**BS Software Engineering Student & Frontend Developer**

GitHub:
https://github.com/Imad-Khan-Software

NexaSolve Tech:
https://nexasolvetech.netlify.app/

---

## ⭐ Support

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.

<div align="center">

**NexaSolve Tech — Smart Code. Seamless Solutions.**

</div>
