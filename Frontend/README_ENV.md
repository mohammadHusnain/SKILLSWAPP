# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `Frontend` directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Notes

- `NEXT_PUBLIC_API_URL`: The base URL for your Django REST API
- `NEXT_PUBLIC_WS_URL`: The WebSocket URL for real-time messaging and notifications
  - For local development: `ws://localhost:8000`
  - For production: `wss://your-domain.com` (use `wss://` for secure WebSocket)

## Setup Instructions

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update the values according to your environment

3. Restart your Next.js development server after making changes

