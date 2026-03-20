
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const logo = PlaceHolderImages.find(img => img.id === 'neu-logo');
  const bgImage = PlaceHolderImages.find(img => img.id === 'landing-bg');

  const handleRoleSelection = (role: 'user' | 'admin') => {
    setLoading(role);
    sessionStorage.setItem('pendingRole', role);
    router.push('/login');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-start p-8 md:p-12 lg:p-16 font-sans overflow-hidden">
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

      <Card className="relative z-10 w-full max-w-[480px] shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white/20 backdrop-blur-xl pt-14 pb-12 px-10 transition-all hover:shadow-primary/20 border border-white/10">
        <CardContent className="flex flex-col items-center space-y-12 p-0">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-xl bg-white flex items-center justify-center">
            {logo && (
              <div className="relative w-full h-full">
                <Image 
                  src={logo.imageUrl} 
                  alt="NEU Logo" 
                  fill 
                  className="object-cover" 
                  data-ai-hint={logo.imageHint}
                  priority
                />
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md uppercase">
              NEW ERA UNIVERSITY<br />LIBRARY
            </h1>
            <p className="text-[12px] text-white/80 font-black uppercase tracking-[0.25em]">Choose your entry point</p>
          </div>

          <div className="w-full space-y-5">
            <Button 
              variant="outline"
              className="w-full h-24 flex items-center justify-between px-8 border-2 border-white/10 hover:border-primary hover:bg-white/10 transition-all group rounded-[2rem] bg-white/10 shadow-sm text-white"
              onClick={() => handleRoleSelection('user')}
              disabled={!!loading}
            >
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-white/10 text-white/50 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <User className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <div className="font-black text-xl text-white leading-none">Visitor</div>
                </div>
              </div>
              {loading === 'user' ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <div className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Button>

            <Button 
              variant="outline"
              className="w-full h-24 flex items-center justify-between px-8 border-2 border-white/10 hover:border-primary hover:bg-white/10 transition-all group rounded-[2rem] bg-white/10 shadow-sm text-white"
              onClick={() => handleRoleSelection('admin')}
              disabled={!!loading}
            >
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-white/10 text-white/50 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <div className="font-black text-xl text-white leading-none">Administrator</div>
                </div>
              </div>
              {loading === 'admin' ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <div className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <footer className="absolute bottom-10 left-0 w-full z-20 px-8 text-center">
        <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.3em] drop-shadow-sm">
          NEW ERA UNIVERSITY LIBRARY | ALL RIGHTS RESERVED
        </p>
      </footer>
      
      <div className="fixed bottom-0 left-0 w-full h-1 bg-primary/20" />
    </div>
  );
}
