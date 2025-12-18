"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminTokenManager } from "@/lib/adminApi";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Admin layout checking auth for path:', pathname);
    
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      console.log('On login page, skipping auth check');
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    const token = adminTokenManager.getToken();
    console.log('Admin token exists:', !!token);
    
    if (!token) {
      console.log('No admin token found, redirecting to login');
      setIsLoading(false);
      router.push('/admin/login');
    } else {
      console.log('Admin token found, authorizing access');
      setIsAuthorized(true);
      setIsLoading(false);
    }
  }, [pathname, router]);

  // Show loading spinner during auth check
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authorized and not on login page, don't render
  if (!isAuthorized && pathname !== '/admin/login') {
    return null;
  }

  // If on login page, render without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <div className="w-64 hidden md:block">
        <AdminSidebar />
      </div>
      <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
