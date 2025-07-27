'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user data is loaded and the user is not an admin, redirect
    if (!loading && user && !user.isAdmin) {
      router.push('/');
    }
    // If the user data is loaded and there is no user, redirect to signin
    if (!loading && !user) {
        router.push('/signin');
    }
  }, [user, loading, router]);

  // While waiting for user data, or if user is not admin, show a loading/unauthorized state
  if (loading || !user || !user.isAdmin) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-11rem)] flex-col items-center justify-center py-16 text-center">
        <ShieldAlert className="h-24 w-24 text-destructive" />
        <h1 className="mt-8 text-4xl font-headline font-bold">Unauthorized</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          You do not have permission to view this page. Redirecting...
        </p>
      </div>
    );
  }

  // If user is an admin, render the admin layout with the admin theme
  return (
    <div className="admin-theme bg-background flex-1">
      <div className="container mx-auto py-16">{children}</div>
    </div>
  );
}
