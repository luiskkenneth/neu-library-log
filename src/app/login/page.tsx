
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, ArrowLeft, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: 'neu.edu.ph',
  prompt: 'select_account'
});

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="mr-3">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 12-4.51z"
      fill="#EA4335"
    />
  </svg>
);

const AUTHORIZED_ADMIN_EMAILS = [
  'jcesperanza@neu.edu.ph',
  'luiskenneth.fajardo@neu.edu.ph'
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { isUserLoading } = useUser();
  const logo = PlaceHolderImages.find(img => img.id === 'neu-logo');
  const bgImage = PlaceHolderImages.find(img => img.id === 'landing-bg');

  useEffect(() => {
    const pendingRole = sessionStorage.getItem('pendingRole');
    if (!pendingRole) {
      router.push('/');
      return;
    }
    setRole(pendingRole);
  }, [router]);

  const checkAndRedirect = async (user: FirebaseUser) => {
    const userEmail = user.email || '';
    if (!userEmail.endsWith('@neu.edu.ph')) {
      setError('Access restricted to @neu.edu.ph accounts only.');
      await auth.signOut();
      setLoading(false);
      return;
    }

    const selectedRole = role || sessionStorage.getItem('pendingRole') || 'user';
    const isAttemptingAdmin = selectedRole === 'admin';

    const isAdminAuthorized = AUTHORIZED_ADMIN_EMAILS.some(
      adminEmail => adminEmail.toLowerCase() === userEmail.toLowerCase()
    );

    if (isAttemptingAdmin && !isAdminAuthorized) {
      setError('Access Denied. Only authorized administrators can access this portal.');
      await auth.signOut();
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, 'userProfiles', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const profile = userDoc.data();
        if (profile.isBlocked) {
          setIsBlocked(true);
          setError('Your account has been restricted by the administrator.');
          await auth.signOut();
          setLoading(false);
          return;
        }
        if (profile.photoURL !== user.photoURL) {
          await updateDoc(userDocRef, { photoURL: user.photoURL });
        }
      } else {
        const newProfile = {
          id: user.uid,
          displayName: user.displayName || user.email?.split('@')[0],
          email: user.email,
          photoURL: user.photoURL,
          role: isAttemptingAdmin ? 'Admin' : 'Visitor',
          isBlocked: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        
        if (isAttemptingAdmin) {
          const adminDocRef = doc(db, 'adminUsers', user.uid);
          await setDoc(adminDocRef, newProfile);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        if (isAttemptingAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/visitor/onboarding');
        }
      }, 1000);
    } catch (err: any) {
      setError('An error occurred while verifying your profile.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await checkAndRedirect(result.user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'An error occurred during sign in.');
      }
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkAndRedirect(result.user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (role === 'admin') {
        if (email && password) {
          handleAdminLogin();
        }
      } else {
        handleGoogleLogin();
      }
    }
  };

  if (isUserLoading && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isVisitor = role !== 'admin';

  return (
    <div className="relative min-h-screen flex items-center justify-start p-8 md:p-12 lg:p-16 overflow-hidden">
      {/* Background Image */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImage.imageUrl}
            alt="NEU Campus Background"
            fill
            className="object-cover brightness-[0.4] scale-150"
            priority
            data-ai-hint={bgImage.imageHint}
          />
        </div>
      )}

      <div className="relative z-10 w-full max-w-[480px] space-y-6">
        <div className="flex justify-start">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Go back
            </Button>
          </Link>
        </div>

        <Card className="shadow-2xl border-none rounded-[2.5rem] bg-white/20 backdrop-blur-xl border border-white/10 overflow-hidden text-white">
          <CardHeader className="space-y-4 text-center pt-12 pb-6">
            <div className="mx-auto w-16 h-16 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center mb-2 shadow-xl">
              {logo && (
                <div className="relative w-full h-full">
                  <Image 
                    src={logo.imageUrl} 
                    alt="New Era University" 
                    fill 
                    className="object-cover" 
                  />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight uppercase">
                {!isVisitor ? 'Administrator Portal' : 'Visitor Access'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-12 px-10">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 border-red-500/20 bg-red-500/10 rounded-2xl text-red-200">
                {isBlocked ? <ShieldAlert className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle className="font-black text-xs uppercase tracking-wider">{isBlocked ? 'Access Restricted' : 'Error'}</AlertTitle>
                <AlertDescription className="text-[11px] font-bold">{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-6 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-black text-lg text-white tracking-tight">Access Granted</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">
                    Institutional Email
                  </Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="Enter your @neu.edu.ph email"
                    className="h-14 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/40 focus:bg-white/20 focus:ring-4 focus:ring-white/5 transition-all font-bold text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                {!isVisitor && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">
                      PASSWORD
                    </Label>
                    <div className="relative">
                      <Input 
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="h-14 pl-11 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/40 focus:bg-white/20 focus:ring-4 focus:ring-white/5 transition-all font-bold text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {!isVisitor && (
                    <Button 
                      className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl bg-white text-slate-900 hover:bg-slate-100"
                      onClick={handleAdminLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'SIGN IN'
                      )}
                    </Button>
                  )}

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-white/30">
                      <span className="bg-transparent px-4">OR</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center justify-center bg-white/10 text-white border border-white/10 hover:bg-white/20"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <GoogleLogo />
                        Continue with Google
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="absolute bottom-10 left-0 w-full z-20 px-8 text-center">
        <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.3em] drop-shadow-sm">
          NEW ERA UNIVERSITY LIBRARY | ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}
