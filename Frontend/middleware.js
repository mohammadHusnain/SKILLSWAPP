import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is a dashboard route
  if (pathname.startsWith('/dashboard')) {
    // Check if user has access token in cookies or headers
    const accessToken = request.cookies.get('access_token')?.value || 
                       request.headers.get('Authorization')?.replace('Bearer ', '');
    
    // If no token, redirect to login
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Allow all other routes to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};

