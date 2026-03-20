"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore, addDocumentNonBlocking, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Building2, 
  ClipboardList, 
  Loader2,
  Home,
  Book,
  Coffee,
  Printer,
  Monitor,
  MessagesSquare,
  Landmark,
  Pencil,
  BookOpen,
  MoreHorizontal
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const DEPARTMENTS = [
  "Integrated School",
  "College of Accountancy",
  "College of Agriculture",
  "College of Arts and Sciences",
  "College of Business Administration",
  "College of Communication",
  "College of Informatics and Computing Studies",
  "College of Criminology",
  "College of Education",
  "College of Engineering and Architecture",
  "College of Medical Technology",
  "College of Midwifery",
  "College of Music",
  "College of Nursing",
  "College of Physical Therapy",
  "College of Respiratory Therapy",
  "School of International Relations"
];

const PURPOSES = [
  { name: "Borrow Books", icon: <Book className="w-6 h-6" />, color: "bg-blue-50 text-blue-600" },
  { name: "Student lounge", icon: <Coffee className="w-6 h-6" />, color: "bg-orange-50 text-orange-600" },
  { name: "Photocopying / Printing Services", icon: <Printer className="w-6 h-6" />, color: "bg-emerald-50 text-emerald-600" },
  { name: "Use of computers", icon: <Monitor className="w-6 h-6" />, color: "bg-indigo-50 text-indigo-600" },
  { name: "Discussion Area", icon: <MessagesSquare className="w-6 h-6" />, color: "bg-purple-50 text-purple-600" },
  { name: "NEU Museum", icon: <Landmark className="w-6 h-6" />, color: "bg-amber-50 text-amber-600" },
  { name: "Assignments / Activities", icon: <Pencil className="w-6 h-6" />, color: "bg-rose-50 text-rose-600" },
  { name: "Study / Reading", icon: <BookOpen className="w-6 h-6" />, color: "bg-sky-50 text-sky-600" },
  { name: "Others", icon: <MoreHorizontal className="w-6 h-6" />, color: "bg-slate-50 text-slate-600" }
];

export default function VisitorOnboarding() {
  const [step, setStep] = useState(0); 
  const [department, setDepartment] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const logo = PlaceHolderImages.find(img => img.id === 'neu-logo');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSuccess) {
      timer = setTimeout(() => {
        handleFinish();
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const handleComplete = (selectedPurpose: string) => {
    if (!user || !db) return;
    
    setSubmitting(true);
    const visitsRef = collection(db, 'visits');
    
    addDocumentNonBlocking(visitsRef, {
      visitorID: user.uid,
      department,
      purpose: selectedPurpose,
      timestamp: serverTimestamp(),
      visitorName: user.displayName || 'Visitor',
      visitorEmail: user.email
    });

    setTimeout(() => {
      setSubmitting(false);
      setShowSuccess(true);
    }, 800);
  };

  const handlePurposeSelect = (val: string) => {
    setPurpose(val);
    handleComplete(val);
  };

  const handleFinish = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className={`w-full transition-all duration-500 ${step === 0 ? 'max-w-xl' : 'max-w-4xl'} space-y-8`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
            {logo && (
              <div className="relative w-full h-full">
                <Image 
                  src={logo.imageUrl} 
                  alt="NEU Logo" 
                  fill 
                  className="object-cover" 
                  data-ai-hint={logo.imageHint}
                />
              </div>
            )}
          </div>
        </div>

        <Card className="shadow-2xl border-none rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-6 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                {step === 0 && <Building2 className="w-6 h-6" />}
                {step === 1 && <ClipboardList className="w-6 h-6" />}
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                  {step === 0 && "Select Department"}
                  {step === 1 && "Purpose of Visit"}
                </CardTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {step === 0 && "TELL US YOUR COLLEGE DEPARTMENT"}
                  {step === 1 && "WHAT BRINGS YOU TO THE LIBRARY TODAY?"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-8 pb-4">
            {step === 0 && (
              <div className="space-y-4">
                <Label htmlFor="department" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">
                  COLLEGE / DEPARTMENT
                </Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department" className="h-16 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-lg px-6">
                    <SelectValue placeholder="Search your department..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] rounded-2xl border-slate-200 shadow-2xl">
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept} className="h-12 font-medium focus:bg-blue-50 focus:text-blue-600 rounded-lg mx-2 my-1">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 1 && (
              <div className="relative">
                {submitting && (
                  <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl gap-4">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                      <div className="absolute inset-0 blur-xl bg-blue-400/30 animate-pulse rounded-full" />
                    </div>
                    <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Logging entry...</p>
                  </div>
                )}
                <RadioGroup value={purpose} onValueChange={handlePurposeSelect} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PURPOSES.map((p) => (
                    <div key={p.name} className="h-full">
                      <RadioGroupItem value={p.name} id={p.name} className="peer sr-only" />
                      <Label
                        htmlFor={p.name}
                        className="flex flex-col items-center justify-center text-center p-6 h-full border-2 rounded-3xl cursor-pointer transition-all duration-300 relative group
                          border-slate-100 hover:border-blue-200 hover:bg-slate-50/50
                          peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:shadow-xl peer-data-[state=checked]:shadow-blue-100"
                      >
                        <div className={`w-14 h-14 rounded-2xl ${p.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                          {p.icon}
                        </div>
                        <span className="font-black text-sm text-slate-900 tracking-tight leading-snug">{p.name}</span>
                        <div className={`absolute top-3 right-3 transition-opacity ${purpose === p.name ? 'opacity-100' : 'opacity-0'}`}>
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-4 pt-4 pb-10 px-8">
            {step > 0 && (
              <Button 
                variant="ghost" 
                className="h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-slate-50 px-8" 
                onClick={() => setStep(step - 1)}
                disabled={submitting}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < 1 && (
              <Button 
                className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-all active:scale-95" 
                onClick={() => setStep(step + 1)}
                disabled={!department || submitting}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showSuccess} onOpenChange={(open) => { if(!open) handleFinish() }}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-12">
          <DialogHeader className="flex flex-col items-center justify-center space-y-10 pt-4">
            <div className="relative">
              <div className="w-32 h-32 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center relative z-10">
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              </div>
              <div className="absolute inset-0 bg-emerald-200 blur-3xl rounded-full scale-150 opacity-50" />
            </div>
            <div className="space-y-4 text-center">
              <DialogTitle className="text-4xl font-black text-slate-900 tracking-tight">
                Welcome, {user?.displayName?.split(' ')[0] || 'Visitor'}!
              </DialogTitle>
              <p className="text-center text-slate-600 font-black uppercase tracking-[0.2em] px-4 text-sm leading-relaxed">
                ENJOY YOUR STAY AT NEW ERA UNIVERSITY LIBRARY
              </p>
            </div>
          </DialogHeader>
          <DialogFooter className="pt-10">
            <Button className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-black font-black text-sm uppercase tracking-[0.2em] transition-all" onClick={handleFinish}>
              <Home className="w-5 h-5 mr-3" />
              Return to Entrance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
