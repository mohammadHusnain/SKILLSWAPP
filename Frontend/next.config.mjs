import fs from 'fs';
import path from 'path';

/** @type {import('next').NextConfig} */

// Validate required environment variables
function validateEnvironment() {
  // Load .env and .env.local manually if they are not loaded yet (Next.js loads them later in the boot cycle)
  const envFiles = ['.env', '.env.local'];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim();
            if (key && !process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }

  const requiredEnvVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_WS_URL',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => {
      console.error(`   - ${v}`);
    });
    console.error('\n💡 Please check your .env.local file and ensure all required variables are configured.');
    console.error('   See env.example for reference.\n');
    process.exit(1);
  }

  console.log('✅ All required environment variables are configured');
}

// Validate environment variables at build/dev start
validateEnvironment();

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(process.cwd()),

  // ✅ Allow external image domains (e.g., Unsplash, Pexels, etc.)
  images: {
    domains: [
      'images.unsplash.com',   // Unsplash
      'cdn.pixabay.com',       // Pixabay
      'pexels.com',            // Pexels
      'images.pexels.com',     // Pexels CDN
      'res.cloudinary.com',    // Cloudinary
      'lh3.googleusercontent.com', // Google images (optional)
    ],
  },

  // ✅ Explicitly expose environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  },
};

export default nextConfig;
