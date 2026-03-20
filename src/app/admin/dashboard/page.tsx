"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { useAuth, useUser, useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { 
  Users, 
  Calendar, 
  LogOut, 
  Search, 
  BarChart3,
  Clock,
  ArrowUpRight,
  Filter,
  ShieldCheck,
  UserX,
  UserCheck,
  Loader2,
  Building2,
  History,
  AlertCircle,
  ChevronDown,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarInset 
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format, startOfDay, subDays, startOfMonth } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DEPT_ABBREVIATIONS: Record<string, string> = {
  "Integrated School": "IS",
  "College of Accountancy": "COA",
  "College of Agriculture": "CAG",
  "College of Arts and Sciences": "CAS",
  "College of Business Administration": "CBA",
  "College of Communication": "COC",
  "College of Informatics and Computing Studies": "CICS",
  "College of Criminology": "CCR",
  "College of Education": "CED",
  "College of Engineering and Architecture": "CEA",
  "College of Medical Technology": "CMT",
  "College of Midwifery": "CMW",
  "College of Music": "COM",
  "College of Nursing": "CON",
  "College of Physical Therapy": "CPT",
  "College of Respiratory Therapy": "CRT",
  "School of International Relations": "SOIR"
};

const getDeptAbbreviation = (name: string) => DEPT_ABBREVIATIONS[name] || name;

const NEU_GREEN = "#1B6E3F";
const DEPT_COLORS = [
  "#1B6E3F", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", 
  "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308", 
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", 
  "#2dd4bf", "#fb923c"
];

type TabType = 'overview' | 'logs' | 'users';
type SortKey = 'timestamp' | 'department' | 'purpose';

export default function AdminDashboard() {
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const logo = PlaceHolderImages.find(img => img.id === 'neu-logo');

  const adminDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'adminUsers', user.uid);
  }, [db, user]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !adminData) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db, adminData]);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !adminData) return null;
    return query(collection(db, 'userProfiles'), orderBy('createdAt', 'desc'));
  }, [db, adminData]);

  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsQuery);
  const { data: userProfiles, isLoading: isUsersLoading } = useCollection(usersQuery);

  const stats = useMemo(() => {
    if (!visits || !mounted) return { today: 0, week: 0, month: 0, uniqueMonthly: 0, topPurpose: '-', busiestDept: '-' };
    
    const now = new Date();
    const startOfToday = startOfDay(now);
    const startOfWeek = subDays(now, 7);
    const startOfThisMonth = startOfMonth(now);

    const todayVisits = visits.filter(v => v.timestamp?.toDate() >= startOfToday);
    const weekVisits = visits.filter(v => v.timestamp?.toDate() >= startOfWeek);
    const monthVisits = visits.filter(v => v.timestamp?.toDate() >= startOfThisMonth);

    const uniqueVisitorIds = new Set(monthVisits.map(v => v.visitorID));

    const depts = todayVisits.reduce((acc: any, v) => {
      acc[v.department] = (acc[v.department] || 0) + 1;
      return acc;
    }, {});
    
    const purposes = todayVisits.reduce((acc: any, v) => {
      acc[v.purpose] = (acc[v.purpose] || 0) + 1;
      return acc;
    }, {});

    const busiestDeptRaw = Object.entries(depts).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0] || '-';
    const topPurpose = Object.entries(purposes).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0] || '-';

    return {
      today: todayVisits.length,
      week: weekVisits.length,
      month: monthVisits.length,
      uniqueMonthly: uniqueVisitorIds.size,
      topPurpose,
      busiestDept: getDeptAbbreviation(busiestDeptRaw)
    };
  }, [visits, mounted]);

  const chartData = useMemo(() => {
    if (!visits || !mounted) return { peakHours: [], deptDist: [], purposeStats: [] };

    const today = startOfDay(new Date());
    const hours = Array.from({ length: 24 }, (_, i) => ({ 
      hour: format(new Date().setHours(i, 0, 0, 0), 'ha'), 
      count: 0,
      rawHour: i 
    }));
    
    visits.filter(v => v.timestamp?.toDate() >= today).forEach(v => {
      const h = v.timestamp.toDate().getHours();
      hours[h].count++;
    });

    const deptCounts: Record<string, number> = {};
    visits.forEach(v => {
      const abbr = getDeptAbbreviation(v.department);
      deptCounts[abbr] = (deptCounts[abbr] || 0) + 1;
    });
    const deptDist = Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const purposeCounts: Record<string, number> = {};
    visits.forEach(v => {
      purposeCounts[v.purpose] = (purposeCounts[v.purpose] || 0) + 1;
    });
    const purposeStats = Object.entries(purposeCounts)
      .map(([purpose, count]) => ({ purpose, count }))
      .sort((a, b) => b.count - a.count);

    return { peakHours: hours, deptDist, purposeStats };
  }, [visits, mounted]);

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    let result = [...visits];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(v => {
        const nameMatch = (v.visitorName || '').toLowerCase().includes(lowerQuery);
        const emailMatch = (v.visitorEmail || '').toLowerCase().includes(lowerQuery);
        const deptName = (v.department || '').toLowerCase();
        const deptAbbr = (getDeptAbbreviation(v.department) || '').toLowerCase();
        const deptMatch = deptName.includes(lowerQuery) || deptAbbr.includes(lowerQuery);
        const purposeMatch = (v.purpose || '').toLowerCase().includes(lowerQuery);
        
        return nameMatch || emailMatch || deptMatch || purposeMatch;
      });
    }

    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'timestamp') {
        valA = a.timestamp?.toDate().getTime() || 0;
        valB = b.timestamp?.toDate().getTime() || 0;
      } else {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [visits, searchQuery, sortBy, sortOrder]);

  const filteredUsers = useMemo(() => {
    if (!userProfiles) return [];
    if (!searchQuery) return userProfiles;
    const lowerQuery = searchQuery.toLowerCase();
    return userProfiles.filter(u => 
      (u.displayName || '').toLowerCase().includes(lowerQuery) ||
      (u.email || '').toLowerCase().includes(lowerQuery) ||
      (u.role || '').toLowerCase().includes(lowerQuery)
    );
  }, [userProfiles, searchQuery]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const fullDateStr = format(now, 'MMMM dd, yyyy h:mm a');

    // Branding Header
    doc.setDrawColor(27, 110, 63); // NEU Green
    doc.setLineWidth(1.5);
    doc.line(14, 15, 196, 15);

    // Main Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(27, 110, 63);
    doc.text('NEU Library - Visitor Statistics Report', 14, 28);

    // Generation Metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Generated: ${fullDateStr}`, 14, 35);

    // Summary Analytics Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 42, 182, 22, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Analytics Summary', 18, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Visitors (Current View): ${filteredVisits.length}`, 18, 58);
    doc.text(`Most Frequent Purpose: ${stats.topPurpose}`, 110, 58);

    // Visitor Logs Table
    const tableHeaders = [['Visitor Name', 'College / Department', 'Purpose of Visit', 'Check-in Time']];
    const tableBody = filteredVisits.map(visit => [
      visit.visitorName || 'Anonymous Visitor',
      getDeptAbbreviation(visit.department),
      visit.purpose,
      visit.timestamp ? format(visit.timestamp.toDate(), 'h:mm a') : 'N/A'
    ]);

    autoTable(doc, {
      startY: 72,
      head: tableHeaders,
      body: tableBody,
      theme: 'striped',
      headStyles: { 
        fillColor: [27, 110, 63], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [240, 245, 242]
      },
      margin: { left: 14, right: 14 }
    });

    const filenameDate = format(now, 'yyyy-MM-dd');
    doc.save(`NEU_Library_Report_${filenameDate}.pdf`);
  };

  const toggleBlockUser = (userId: string, currentStatus: boolean) => {
    if (!db) return;
    const userRef = doc(db, 'userProfiles', userId);
    updateDocumentNonBlocking(userRef, { isBlocked: !currentStatus });
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminData && !isAdminLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 space-y-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h1>
          <p className="text-slate-500 font-medium max-w-sm">
            You do not have the required administrative permissions to view this dashboard. 
          </p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="rounded-xl px-8 h-12 font-bold">
          <LogOut className="w-4 h-4 mr-2" />
          Back to Login
        </Button>
      </div>
    );
  }

  const adminName = adminData?.displayName || user?.displayName?.split(' ').slice(0, 2).join(' ') || 'Administrator';
  const adminPhoto = adminData?.photoURL || user?.photoURL;
  
  const peakHoursConfig = {
    count: { label: "Visitors", color: NEU_GREEN },
  } satisfies ChartConfig;

  const deptDistConfig = {
    value: { label: "Check-ins" },
  } satisfies ChartConfig;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#F8FAFC] w-full">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                {logo && (
                  <div className="relative w-8 h-8">
                    <Image src={logo.imageUrl} alt="NEU Logo" fill className="object-contain" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-black text-sm leading-tight text-slate-900 tracking-tight uppercase">NEU LIBRARY</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Admin Dashboard</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} className="h-11 rounded-xl transition-all">
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-bold">Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} className="h-11 rounded-xl transition-all">
                  <History className="w-5 h-5" />
                  <span className="font-bold">Visitor Logs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} className="h-11 rounded-xl transition-all">
                  <Users className="w-5 h-5" />
                  <span className="font-bold">Users & Access</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <div className="mt-auto p-6 border-t border-slate-100">
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={adminPhoto || ''} alt={adminName} />
                <AvatarFallback className="bg-blue-600 text-white font-black text-xs uppercase">{adminName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">{adminName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/5 rounded-xl font-bold transition-colors" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <SidebarInset className="flex-1 overflow-auto">
          <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">ADMIN DASHBOARD</h1>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {activeTab === 'overview' && 'Overview'}
                  {activeTab === 'logs' && 'Visitor Logs'}
                  {activeTab === 'users' && 'User Access'}
                </span>
              </div>
            </div>
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="Search by name, email, or department..."
                className="pl-11 h-11 w-[320px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-medium" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          <main className="p-8 space-y-12 max-w-[1600px] mx-auto pb-16">
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Today\'s Check-ins', value: stats.today, trend: '+12%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'Monthly Unique', value: stats.uniqueMonthly, trend: 'Unique', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { title: 'Peak Purpose', value: stats.topPurpose, trend: 'Most Used', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { title: 'Top Department', value: stats.busiestDept, trend: 'Active', icon: Building2, color: 'text-orange-600', bg: 'bg-orange-50' },
                  ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                        <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="h-4.5 w-4.5" /></div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-black text-slate-900 tracking-tight truncate">{stat.value}</div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className={`px-1.5 py-0.5 rounded-md ${stat.bg} flex items-center gap-1`}>
                            <ArrowUpRight className={`w-3 h-3 ${stat.color}`} />
                            <span className={`text-[10px] font-bold ${stat.color}`}>{stat.trend}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Analytics</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="px-8 pt-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-black text-slate-900">Peak Visitor Hours</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Library traffic density across 24 hours</CardDescription>
                        </div>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-8">
                      <ChartContainer config={peakHoursConfig} className="h-[320px] w-full">
                        <AreaChart data={chartData.peakHours} margin={{ left: 12, right: 12, top: 20 }}>
                          <defs>
                            <linearGradient id="fillColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={NEU_GREEN} stopOpacity={0.1}/><stop offset="95%" stopColor={NEU_GREEN} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} interval={3} />
                          <YAxis hide />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="count" stroke={NEU_GREEN} strokeWidth={3} fillOpacity={1} fill="url(#fillColor)" />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-2">
                      <CardTitle className="text-xl font-black text-slate-900">Department Mix</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Distribution across colleges</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-8">
                      <ChartContainer config={deptDistConfig} className="h-[280px] w-full">
                        <PieChart>
                          <Pie data={chartData.deptDist} dataKey="value" nameKey="name" innerRadius={65} outerRadius={85} paddingAngle={5} stroke="none">
                            {chartData.deptDist.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="w-full mt-8 space-y-2.5">
                        {chartData.deptDist.slice(0, 5).map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                              <span className="text-slate-600 uppercase tracking-tighter">{d.name}</span>
                            </div>
                            <span className="text-slate-900 font-black">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-xl font-black text-slate-900">Visit Purpose</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analysis of library activities</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <ChartContainer config={{}} className="h-[340px] w-full">
                        <BarChart layout="vertical" data={chartData.purposeStats} margin={{ top: 10, left: 0, right: 10, bottom: 0 }}>
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="purpose" type="category" hide />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill={NEU_GREEN} radius={[0, 4, 4, 0]} barSize={32} minPointSize={120}>
                            <LabelList dataKey="purpose" position="insideLeft" offset={12} className="fill-white font-black text-[9px] uppercase tracking-tight whitespace-nowrap" />
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Recent Activity Feed</CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Live updates from library sectors</CardDescription>
                      </div>
                      <Button variant="ghost" className="text-blue-600 font-black text-xs uppercase hover:bg-blue-50" onClick={() => setActiveTab('logs')}>View All</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[200px] pl-8 text-[10px] font-black text-slate-400 uppercase">Visitor</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-400 uppercase">College</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-400 uppercase">Check-in</TableHead>
                            <TableHead className="pr-8 text-right text-[10px] font-black text-slate-400 uppercase">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isVisitsLoading ? (
                            <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-400 text-xs font-bold animate-pulse">Synchronizing Feed...</TableCell></TableRow>
                          ) : filteredVisits?.slice(0, 6).map((visit) => (
                            <TableRow key={visit.id} className="group hover:bg-slate-50/50 border-slate-50">
                              <TableCell className="pl-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-100">{visit.visitorName?.charAt(0) || 'V'}</div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate text-sm">{visit.visitorName}</p>
                                    <p className="text-[10px] text-slate-500 font-bold truncate uppercase">{visit.visitorEmail?.split('@')[0]}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell><p className="text-xs font-black text-slate-600 uppercase tracking-tighter">{getDeptAbbreviation(visit.department)}</p></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px]">
                                  <Clock className="w-3.5 h-3.5 text-emerald-500" />{visit.timestamp ? format(visit.timestamp.toDate(), 'h:mm a') : '...'}
                                </div>
                              </TableCell>
                              <TableCell className="pr-8 text-right">
                                <Badge className="bg-emerald-500 text-white border-none rounded-lg text-[9px] font-black px-2.5 py-1 uppercase tracking-wider">Verified</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === 'logs' && (
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Visitor Logs</CardTitle>
                    <CardDescription className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] mt-2">Historical and Real-time access data</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest h-10 px-6">
                          <Filter className="w-4 h-4 mr-2" />Sort By<ChevronDown className="w-3 h-3 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 py-1.5">Sort Criteria</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={`rounded-lg font-bold text-xs px-3 py-2 cursor-pointer ${sortBy === 'timestamp' ? 'bg-blue-50 text-blue-600' : ''}`} onClick={() => toggleSort('timestamp')}>
                          Date & Time{sortBy === 'timestamp' && <span className="ml-auto text-[10px] uppercase">{sortOrder}</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem className={`rounded-lg font-bold text-xs px-3 py-2 cursor-pointer ${sortBy === 'department' ? 'bg-blue-50 text-blue-600' : ''}`} onClick={() => toggleSort('department')}>
                          College / Department{sortBy === 'department' && <span className="ml-auto text-[10px] uppercase">{sortOrder}</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem className={`rounded-lg font-bold text-xs px-3 py-2 cursor-pointer ${sortBy === 'purpose' ? 'bg-blue-50 text-blue-600' : ''}`} onClick={() => toggleSort('purpose')}>
                          Visit Purpose{sortBy === 'purpose' && <span className="ml-auto text-[10px] uppercase">{sortOrder}</span>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      className="rounded-xl bg-slate-900 hover:bg-black font-black text-[10px] uppercase tracking-widest h-10 px-6"
                      onClick={handleExportPDF}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export PDF Report {mounted ? `(${format(new Date(), 'MM/dd/yy')})` : ''}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="w-[300px] pl-10 text-[10px] font-black text-slate-400 uppercase tracking-widest py-5">Visitor Profile</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector / Department</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Purpose</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ARRIVAL TIME</TableHead>
                        <TableHead className="pr-10 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVisits.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-64 text-center"><Search className="w-12 h-12 opacity-20 mx-auto" /><p className="font-bold text-sm text-slate-400 mt-4">No records found.</p></TableCell></TableRow>
                      ) : (
                        filteredVisits.map((visit) => (
                          <TableRow key={visit.id} className="group hover:bg-emerald-50/30 transition-colors border-slate-100">
                            <TableCell className="pl-10 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-sm group-hover:scale-110 transition-transform">{visit.visitorName?.charAt(0) || 'V'}</div>
                                <div className="min-w-0">
                                  <p className="font-black text-slate-900 text-sm tracking-tight">{visit.visitorName}</p>
                                  <p className="text-[11px] text-slate-500 font-bold">{visit.visitorEmail}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><p className="text-sm font-bold text-slate-700">{getDeptAbbreviation(visit.department)}</p></div></TableCell>
                            <TableCell><Badge variant="secondary" className="bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold py-1 px-3">{visit.purpose}</Badge></TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-900">{visit.timestamp ? format(visit.timestamp.toDate(), 'h:mm a') : '...'}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{visit.timestamp ? format(visit.timestamp.toDate(), 'MM/dd/yy') : ''}</span>
                              </div>
                            </TableCell>
                            <TableCell className="pr-10 text-right"><ShieldCheck className="w-5 h-5 text-emerald-600 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && (
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Access Control</CardTitle>
                    <CardDescription className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] mt-2">Manage library entry permissions</CardDescription>
                  </div>
                  <Badge className="bg-blue-600 text-white border-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">{userProfiles?.length || 0} Registered Users</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="pl-10 text-[10px] font-black text-slate-400 uppercase tracking-widest py-5">User Profile</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Date</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Status</TableHead>
                        <TableHead className="pr-10 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isUsersLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-20 text-center animate-pulse text-slate-400 font-bold uppercase text-xs">Synchronizing User Profiles...</TableCell></TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-64 text-center"><UserX className="w-12 h-12 opacity-20 mx-auto" /><p className="font-bold text-sm text-slate-400 mt-4">No users found.</p></TableCell></TableRow>
                      ) : (
                        filteredUsers.map((profile) => (
                          <TableRow key={profile.id} className="group hover:bg-slate-50 border-slate-100 transition-colors">
                            <TableCell className="pl-10 py-6">
                              <div className="flex items-center gap-4">
                                <Avatar className={`h-12 w-12 rounded-2xl shadow-lg ${profile.isBlocked ? 'grayscale' : ''}`}>
                                  <AvatarImage src={profile.photoURL || ''} alt={profile.displayName || ''} />
                                  <AvatarFallback className={`rounded-2xl flex items-center justify-center text-white font-black text-sm ${profile.isBlocked ? 'bg-slate-400' : 'bg-gradient-to-tr from-blue-600 to-indigo-600'}`}>
                                    {profile.displayName?.charAt(0) || profile.email?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className={`font-black text-sm tracking-tight ${profile.isBlocked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{profile.displayName || 'Anonymous Visitor'}</p>
                                  <p className="text-[11px] text-slate-500 font-bold">{profile.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className={`rounded-lg text-[10px] font-black uppercase tracking-wider px-2.5 py-1 ${profile.role === 'Admin' ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-slate-200 text-slate-600 bg-white'}`}>{profile.role}</Badge></TableCell>
                            <TableCell><p className="text-xs font-bold text-slate-500">{profile.createdAt ? format(new Date(profile.createdAt), 'MM/dd/yy') : 'N/A'}</p></TableCell>
                            <TableCell><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${profile.isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} /><span className={`text-[10px] font-black uppercase tracking-wider ${profile.isBlocked ? 'text-red-600' : 'text-emerald-600'}`}>{profile.isBlocked ? 'Blocked' : 'Active'}</span></div></TableCell>
                            <TableCell className="pr-10 text-right">
                              <Button variant={profile.isBlocked ? "outline" : "destructive"} size="sm" className={`rounded-xl font-black text-[10px] uppercase h-9 px-4 ${profile.isBlocked ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'shadow-lg shadow-red-100'}`} onClick={() => toggleBlockUser(profile.id, !!profile.isBlocked)} disabled={profile.id === user?.uid}>
                                {profile.isBlocked ? <><UserCheck className="w-3.5 h-3.5 mr-2" />Unblock</> : <><UserX className="w-3.5 h-3.5 mr-2" />Block Access</>}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
