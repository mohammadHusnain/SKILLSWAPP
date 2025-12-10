# SkillSwap Frontend

A modern Next.js 15 frontend for the SkillSwap skill exchange platform - a crowd-powered network that connects people to teach and learn skills from each other.

## Features

- **Next.js 15** with App Router for modern React development
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for beautiful, accessible UI components
- **Animation Libraries**: Framer Motion, GSAP, React Spring for smooth animations
- **Axios** for API communication with Django backend
- **Responsive Design** with mobile-first approach
- **Modern UI/UX** with clean, intuitive interface

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion, GSAP, React Spring
- **HTTP Client**: Axios
- **Language**: JavaScript (ES6+)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Backend server running (see Backend README)

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd Frontend/skillswap-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Setup environment variables:**
   ```bash
   cp env.example .env.local
   ```
   Edit `.env.local` with your configuration values.

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Variables

Create a `.env.local` file based on `env.example`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Stripe Configuration (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME=SkillSwap
NEXT_PUBLIC_APP_DESCRIPTION=A crowd-powered skill exchange network
```

## Project Structure

```
Frontend/skillswap-frontend/
├── src/
│   └── app/                 # Next.js App Router
│       ├── globals.css      # Global styles
│       ├── layout.js        # Root layout
│       └── page.js          # Home page
├── public/                  # Static assets
├── components.json          # shadcn/ui configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
└── env.example             # Environment variables template
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Development

The application uses:
- **App Router** for file-based routing
- **Server Components** by default for better performance
- **Client Components** with `"use client"` directive when needed
- **Tailwind CSS** for styling with utility classes
- **shadcn/ui** components for consistent UI

## Integration

This frontend integrates with:
- **Django REST Framework** backend API
- **MongoDB** database via Django
- **JWT Authentication** for secure user sessions
- **WebSocket** for real-time messaging
- **Stripe** for payment processing (test mode)


