import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SkillSwap | AI-Powered Skill Exchange Platform",
  description: "Connect, learn, and grow with SkillSwap - the revolutionary AI-driven platform that matches learners with expert mentors worldwide. Master new skills through collaborative learning.",
  keywords: [
    "skill exchange",
    "AI matching",
    "online learning",
    "mentorship",
    "collaborative learning",
    "skill development",
    "expert matching",
    "learning platform"
  ],
  authors: [{ name: "SkillSwap Team" }],
  creator: "SkillSwap",
  publisher: "SkillSwap",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://skillswap.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "SkillSwap | AI-Powered Skill Exchange Platform",
    description: "Connect, learn, and grow with SkillSwap - the revolutionary AI-driven platform that matches learners with expert mentors worldwide.",
    url: 'https://skillswap.com',
    siteName: 'SkillSwap',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SkillSwap - AI-Powered Skill Exchange Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SkillSwap | AI-Powered Skill Exchange Platform",
    description: "Connect, learn, and grow with SkillSwap - the revolutionary AI-driven platform that matches learners with expert mentors worldwide.",
    images: ['/og-image.jpg'],
    creator: '@skillswap',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0b132b" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
