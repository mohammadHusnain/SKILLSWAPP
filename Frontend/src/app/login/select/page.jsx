"use client";

import Link from "next/link";
import { User, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SkillSwapLogo from "@/components/SkillSwapLogo";

export default function LoginSelectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <SkillSwapLogo className="h-16 w-16" />
          </div>
          <h1 className="text-4xl font-bold text-text mb-4">Welcome to SkillSwap</h1>
          <p className="text-text-muted text-lg">Choose your login type to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Login Option */}
          <Link href="/login" className="group">
            <Card className="h-full glass border-transparent hover:border-accent/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-white/5">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-accent/10 rounded-full group-hover:bg-accent/20 transition-colors">
                  <User className="w-12 h-12 text-accent" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-text">Login as User</h2>
                  <p className="text-text-muted text-sm">
                    Access your courses, track progress, and connect with mentors.
                  </p>
                </div>
                <Button className="w-full bg-accent hover:bg-accent-light text-white rounded-full">
                  Continue as User
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Admin Login Option */}
          <Link href="/admin/login" className="group">
            <Card className="h-full glass border-transparent hover:border-accent/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-white/5">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-accent/10 rounded-full group-hover:bg-accent/20 transition-colors">
                  <ShieldCheck className="w-12 h-12 text-accent" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-text">Login as Admin 🛡️</h2>
                  <p className="text-text-muted text-sm">
                    Manage profiles, matching, and platform analytics.
                  </p>
                </div>
                <Button className="w-full bg-accent hover:bg-accent-light text-white rounded-full transition-all">
                  Continue as Admin
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-12 text-center">
            <Link href="/">
            <Button
                variant="ghost"
                className="text-text-muted hover:text-text flex items-center justify-center space-x-2 mx-auto"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
            </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
