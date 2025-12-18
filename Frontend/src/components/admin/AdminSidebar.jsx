"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  GitCompareArrows, 
  LogOut,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { adminService } from "@/lib/adminApi";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    adminService.logout();
    router.push("/admin/login");
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Profiles",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Matches",
      href: "/admin/matches",
      icon: GitCompareArrows,
    },
  ];

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-6 border-b flex items-center gap-2">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <div className="font-bold text-xl">SkillSwap <span className="text-primary text-sm font-normal block">Admin Panel</span></div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
              pathname === item.href || pathname?.startsWith(item.href + '/')
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.title}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
