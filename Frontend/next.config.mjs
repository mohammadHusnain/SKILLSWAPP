/** @type {import('next').NextConfig} */

// Validate required environment variables
function validateEnvironment() {
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
