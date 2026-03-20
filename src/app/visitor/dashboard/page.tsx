
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VisitorDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Visitor Dashboard is removed in Phase 3. Redirecting to onboarding or home.
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Redirecting...</p>
    </div>
  );
}
