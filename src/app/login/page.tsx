import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">24 @ 24</p>
          <h1 className="text-xl font-semibold">Sign in</h1>
        </div>
        <Suspense fallback={<div className="h-40" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
