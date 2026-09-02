import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { PublicHeader } from "../../components/layout/PublicHeader";
import { PublicFooter } from "../../components/layout/PublicFooter";
import {
  ArrowRight,
  Menu,
  X,
  Shield,
  Lock,
  Eye,
  FileCheck,
  Check,
  Kanban,
  Clock,
  CheckCircle2,
  FolderKanban,
  Plus,
  LayoutDashboard,
  Users,
  Sparkles
} from "lucide-react";

// ========== BUTTON COMPONENT ==========

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-medium transition-all cursor-pointer disabled:opacity-50 select-none";
  const variantStyle =
    variant === "outline"
      ? "border border-stone-300 bg-white/80 text-stone-800 hover:bg-stone-100/80 hover:border-stone-400 shadow-xs"
      : "bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-md shadow-stone-900/10";
  const sizeStyle =
    size === "sm"
      ? "px-4 py-1.5 text-xs rounded-full"
      : size === "lg"
        ? "px-8 py-3.5 text-base rounded-full"
        : "px-6 py-2.5 text-sm rounded-full";

  return (
    <button className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ========== ANIMATED GRAPHICS ==========

function AnimatedSphere() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <radialGradient id="sphereGrad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#0052CC" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="180" fill="url(#sphereGrad)" />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={i}
          cx="200"
          cy="200"
          r={120 + i * 20}
          fill="none"
          stroke="#0052CC"
          strokeWidth="1"
          opacity="0.15"
        >
          <animate
            attributeName="r"
            values={`${120 + i * 20};${160 + i * 20};${120 + i * 20}`}
            dur={`${3 + i * 0.5}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.15;0.3;0.15"
            dur={`${3 + i * 0.5}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

function AnimatedTetrahedron() {
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full text-stone-700">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[0, 1, 2, 3].map((i) => {
        const angle = i * 90 * (Math.PI / 180);
        const x = 150 + Math.cos(angle) * 80;
        const y = 150 + Math.sin(angle) * 80;
        return (
          <g key={i}>
            <line x1="150" y1="150" x2={x} y2={y} stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx={x} cy={y} r="8" fill="currentColor" opacity="0.5">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}

      <circle cx="150" cy="150" r="12" fill="currentColor" filter="url(#glow)">
        <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function AnimatedCounter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, hasAnimated]);

  return (
    <div ref={ref} className="text-6xl lg:text-8xl font-display tracking-tight text-stone-900">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

// ========== LIGHT / WHITE BACKGROUND VISUAL COMPONENTS (COMPACT & RICH) ==========

function DeployVisual() {
  return (
    <div className="w-full h-full bg-white p-4 lg:p-5 flex flex-col justify-between border border-[#DFE1E6] rounded-2xl shadow-xs text-[#172B4D]">
      <div className="flex items-center justify-between border-b border-[#EBECF0] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5630]" />
          <div className="w-3 h-3 rounded-full bg-[#FFAB00]" />
          <div className="w-3 h-3 rounded-full bg-[#36B37E]" />
          <span className="ml-1 text-xs font-bold font-mono text-[#0052CC]">
            BOARD: Task Management System
          </span>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DEEBFF] text-[#0052CC] font-bold">
          4 Columns
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1 pt-3">
        {/* TODO */}
        <div className="bg-[#FAFBFC] p-2 rounded-xl border border-[#DFE1E6] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#5E6C84]">TODO</span>
            <span className="text-xs bg-[#DFE1E6] px-1.5 py-0.5 rounded text-[#172B4D] font-bold">2</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-[#DFE1E6] text-xs shadow-2xs space-y-1">
            <span className="font-mono text-[10px] text-[#0052CC] font-semibold block">TASK-101</span>
            <span className="font-semibold text-[#172B4D] block truncate text-xs">OTP Auth UI</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFEBE6] text-[#DE350B] inline-block">URGENT</span>
          </div>
        </div>

        {/* DOING */}
        <div className="bg-[#FAFBFC] p-2 rounded-xl border border-[#DFE1E6] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#0052CC]">DOING</span>
            <span className="text-xs bg-[#DEEBFF] px-1.5 py-0.5 rounded text-[#0052CC] font-bold">1</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-[#4C9AFF]/50 text-xs shadow-2xs space-y-1">
            <span className="font-mono text-[10px] text-[#0052CC] font-semibold block">TASK-102</span>
            <span className="font-semibold text-[#172B4D] block truncate text-xs">OAuth2 Backend</span>
            <div className="w-full bg-[#EBECF0] h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-[#0052CC] h-full w-3/4 animate-pulse" />
            </div>
          </div>
        </div>

        {/* REVIEW */}
        <div className="bg-[#FAFBFC] p-2 rounded-xl border border-[#DFE1E6] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#5243AA]">REVIEW</span>
            <span className="text-xs bg-[#EAE6FF] px-1.5 py-0.5 rounded text-[#5243AA] font-bold">1</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-[#DFE1E6] text-xs shadow-2xs space-y-1">
            <span className="font-mono text-[10px] text-[#0052CC] font-semibold block">TASK-103</span>
            <span className="font-semibold text-[#172B4D] block truncate text-xs">Code Review PR</span>
          </div>
        </div>

        {/* DONE */}
        <div className="bg-[#FAFBFC] p-2 rounded-xl border border-[#DFE1E6] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#006644]">DONE</span>
            <span className="text-xs bg-[#E3FCEF] px-1.5 py-0.5 rounded text-[#006644] font-bold">3</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-[#36B37E]/40 text-xs shadow-2xs opacity-80 space-y-1">
            <span className="font-mono text-[10px] text-[#006644] font-semibold block">TASK-100</span>
            <span className="line-through text-[#5E6C84] block truncate text-xs">DB Migration</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIVisual() {
  return (
    <div className="w-full h-full bg-white p-4 lg:p-5 flex flex-col justify-between border border-[#DFE1E6] rounded-2xl shadow-xs text-[#172B4D]">
      <div className="flex items-center justify-between border-b border-[#EBECF0] pb-2.5">
        <span className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
          📊 Admin Dashboard (Scope Overview)
        </span>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E3FCEF] text-[#006644]">
          LIVE MONITOR
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 my-auto">
        <div className="bg-[#DEEBFF] p-2.5 rounded-xl text-center border border-[#4C9AFF]/20">
          <span className="text-[10px] font-bold text-[#5E6C84] block uppercase">Total Tasks</span>
          <span className="text-lg font-bold font-mono text-[#0052CC]">128</span>
        </div>
        <div className="bg-[#E3FCEF] p-2.5 rounded-xl text-center border border-[#36B37E]/20">
          <span className="text-[10px] font-bold text-[#5E6C84] block uppercase">Completed</span>
          <span className="text-lg font-bold font-mono text-[#006644]">84</span>
        </div>
        <div className="bg-[#FFF0B3] p-2.5 rounded-xl text-center border border-[#FFAB00]/20">
          <span className="text-[10px] font-bold text-[#5E6C84] block uppercase">In Progress</span>
          <span className="text-lg font-bold font-mono text-[#FF8B00]">32</span>
        </div>
        <div className="bg-[#EAE6FF] p-2.5 rounded-xl text-center border border-[#5243AA]/20">
          <span className="text-[10px] font-bold text-[#5E6C84] block uppercase">Members</span>
          <span className="text-lg font-bold font-mono text-[#5243AA]">14</span>
        </div>
      </div>

      <div className="p-2 bg-[#FAFBFC] rounded-lg border border-[#EBECF0] text-xs text-[#5E6C84] flex items-center justify-between">
        <span className="truncate font-medium">📌 Admin configured JWT Security & RBAC Roles</span>
        <span className="font-mono text-xs text-[#0052CC] font-semibold shrink-0 ml-2">Just now</span>
      </div>
    </div>
  );
}

function CollabVisual() {
  return (
    <div className="w-full h-full bg-white p-4 lg:p-5 flex flex-col justify-between border border-[#DFE1E6] rounded-2xl shadow-xs text-[#172B4D]">
      <div className="flex items-center justify-between border-b border-[#EBECF0] pb-2.5">
        <span className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
          👥 Project Members & Roles
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#DEEBFF] text-[#0052CC] cursor-pointer">
          + Invite Member
        </span>
      </div>

      <div className="space-y-2 my-auto">
        <div className="p-2 bg-[#FAFBFC] rounded-xl border border-[#EBECF0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
              HT
            </div>
            <div>
              <span className="font-bold text-[#172B4D] block leading-tight">Hung Tran</span>
              <span className="text-[10px] text-[#5E6C84]">hung@company.com</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DEEBFF] text-[#0052CC]">OWNER</span>
        </div>

        <div className="p-2 bg-[#FAFBFC] rounded-xl border border-[#EBECF0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#5243AA] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
              AD
            </div>
            <div>
              <span className="font-bold text-[#172B4D] block leading-tight">Alex Dev</span>
              <span className="text-[10px] text-[#5E6C84]">alex@company.com</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAE6FF] text-[#5243AA]">ADMIN</span>
        </div>
      </div>
    </div>
  );
}

function SecurityVisual() {
  return (
    <div className="w-full h-full bg-white p-4 lg:p-5 flex flex-col justify-between items-center border border-[#DFE1E6] rounded-2xl shadow-xs text-[#172B4D]">
      <div className="w-full flex items-center justify-between border-b border-[#EBECF0] pb-2.5">
        <span className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
          🛡️ Email OTP 2-Factor Auth
        </span>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E3FCEF] text-[#006644]">
          SECURE
        </span>
      </div>

      <div className="text-center my-auto space-y-2">
        <span className="text-xs text-[#5E6C84] block font-medium">Enter 6-digit OTP code sent to email</span>
        <div className="flex justify-center gap-1.5">
          {["4", "8", "9", "2", "1", "7"].map((digit, idx) => (
            <div
              key={idx}
              className="w-7 h-9 rounded-lg bg-[#FAFBFC] border-2 border-[#0052CC] text-[#0052CC] font-mono font-bold text-sm flex items-center justify-center shadow-xs"
            >
              {digit}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full text-center pt-2 border-t border-[#EBECF0]">
        <span className="text-xs text-[#5E6C84] font-medium">Resend code in 59s</span>
      </div>
    </div>
  );
}

function AnimatedVisual({ type }: { type: string }) {
  switch (type) {
    case "deploy":
      return <DeployVisual />;
    case "ai":
      return <AIVisual />;
    case "collab":
      return <CollabVisual />;
    case "security":
      return <SecurityVisual />;
    default:
      return <DeployVisual />;
  }
}

// ========== MAIN COMPONENT (ORIGINAL LAYOUT STRUCTURE) ==========

export const HomePage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [activeLocation, setActiveLocation] = useState(0);
  const [isAnnual, setIsAnnual] = useState(true);
  const [time, setTime] = useState(new Date());

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Infrastructure", href: "#infrastructure" },
    { name: "Pricing", href: "#pricing" },
  ];

  const features = [
    {
      number: "01",
      title: "Real-time Kanban Boards",
      description:
        "Track every task from To Do, In Progress to Completed with instant drag-and-drop workflow visualization.",
      visual: "deploy",
    },
    {
      number: "02",
      title: "Role-Based Access Control",
      description:
        "Tailored workspaces for System Admins (overview & user management) and Members (personal task view).",
      visual: "ai",
    },
    {
      number: "03",
      title: "Team Collaboration & OTP",
      description:
        "Invite colleagues to your projects via email with 6-digit OTP verification codes and Google OAuth2.",
      visual: "collab",
    },
    {
      number: "04",
      title: "Enterprise Security & Audit",
      description:
        "Bank-grade email OTP two-factor security, stateless JWT token auth, and granular project permission control.",
      visual: "security",
    },
  ];

  const steps = [
    {
      number: "I",
      title: "Create Project & Invite Team",
      description: "Set up a new project in seconds. Enter colleague emails to automatically send OTP invitation codes.",
      code: `import { projectApi } from '@/services/projectApi'

await projectApi.inviteMember({
  projectId: 'PRJ-2026',
  email: 'colleague@company.com',
  role: 'MEMBER'
})`,
    },
    {
      number: "II",
      title: "Break Down & Assign Tasks",
      description: "Create tasks, set priority levels (Urgent/High/Medium), attach due dates, and designate assignees.",
      code: `import { taskApi } from '@/services/taskApi'

await taskApi.createTask({
  title: 'Integrate Google OAuth2',
  priority: 'HIGH',
  dueDate: '2026-09-15',
  assigneeId: 'USR-88'
})`,
    },
    {
      number: "III",
      title: "Track & Deliver on Kanban",
      description: "Update real-time progress on Kanban boards, collaborate with your team, and deliver projects on time.",
      code: `await taskApi.updateStatus(taskId, 'COMPLETED')

// Real-time Kanban board updated
// Project progress: 100% completed`,
    },
  ];

  const locations = [
    { city: "Admin Workspace", region: "Full System Control", latency: "Active" },
    { city: "Member Workspace", region: "My Tasks & Profile", latency: "Active" },
    { city: "Kanban Board", region: "Drag & Drop Workflow", latency: "Live" },
    { city: "Email OTP Auth", region: "2-Factor Verification", latency: "Secure" },
    { city: "Google OAuth2", region: "Single Sign-On Auth", latency: "Live" },
    { city: "Analytics Engine", region: "Completion Reports", latency: "Real-time" },
  ];

  const metrics = [
    { value: 99, suffix: ".9%", prefix: "", label: "On-time completion rate" },
    { value: 10000, suffix: "+", prefix: "", label: "Tasks managed daily" },
    { value: 500, suffix: "+", prefix: "", label: "Projects completed" },
    { value: 100, suffix: "%", prefix: "", label: "Secure Email OTP auth" },
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: "Email OTP 2-Factor Auth",
      description: "6-digit verification code sent directly to email for secure login and project invitations.",
    },
    {
      icon: Lock,
      title: "Role-Based Access Control",
      description: "Strict permission separation between System Admins and Project Members.",
    },
    {
      icon: Eye,
      title: "Stateless JWT Authentication",
      description: "Every request is verified with secure JWT tokens and OAuth2 integration.",
    },
    {
      icon: FileCheck,
      title: "GDPR & Data Protection",
      description: "Full compliance with data privacy standards to keep project data safe.",
    },
  ];

  const certifications = ["Email OTP", "JWT Auth", "Google OAuth2", "GDPR", "RBAC Security"];

  const plans = [
    {
      name: "Starter",
      description: "For individuals and small working teams",
      price: { monthly: 0, annual: 0 },
      features: [
        "Up to 5 projects",
        "Up to 10 members",
        "Intuitive Kanban boards",
        "Email OTP authentication",
        "Community support",
      ],
      cta: "Start free",
      popular: false,
    },
    {
      name: "Pro",
      description: "For growing teams and businesses",
      price: { monthly: 29, annual: 24 },
      features: [
        "Unlimited projects",
        "Unlimited members",
        "Advanced Admin Dashboard",
        "Granular RBAC role permissions",
        "Google OAuth2 login",
        "In-depth progress analytics",
        "24/7 Priority support",
      ],
      cta: "Start trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large-scale operations and companies",
      price: { monthly: null, annual: null },
      features: [
        "Everything in Pro",
        "Custom API integrations",
        "Dedicated cloud server",
        "99.99% SLA guarantee",
        "On-premise option",
        "Custom contracts & SLA",
      ],
      cta: "Contact sales",
      popular: false,
    },
  ];

  // Effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [steps.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLocation((prev) => (prev + 1) % locations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [locations.length]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const words = ["plan effectively", "track progress", "assign tasks", "boost productivity"];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#FAF8F5] text-stone-900 noise-overlay font-sans selection:bg-blue-500 selection:text-white">
      {/* ========== NAVIGATION HEADER ========== */}
      <PublicHeader transparentOnTop={true} />

      {/* ========== HERO SECTION (ORIGINAL LAYOUT) ========== */}
      <section className="relative pt-18 lg:pt-22 pb-10 lg:pb-24 px-6 lg:px-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className={`lg:col-span-7 transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono text-stone-700 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>NEXT-GEN TASK MANAGEMENT SYSTEM</span>
            </div>

            <h1 className="text-2xl sm:text-6xl lg:text-7xl xl:text-8xl font-display tracking-tight text-stone-900 leading-[0.95] mb-6">
              Manage projects & tasks to empower your team to{" "}
              <span className="inline-block text-[#0052CC] min-w-[220px]">
                {words[wordIndex]}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-stone-600 max-w-2xl font-normal leading-relaxed mb-8">
              All-in-one task and project management platform featuring real-time Kanban boards, role-based access control (Admin & Member), email OTP invitation, and automated progress tracking.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2 group bg-[#0052CC] hover:bg-[#0747A6]">
                  <span>Start for free</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg">
                  How it works
                </Button>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="aspect-square w-full max-w-[500px] mx-auto relative">
              <AnimatedSphere />
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES SECTION (ORIGINAL LAYOUT) ========== */}
      <section id="features" className="py-16 lg:py-20 px-6 lg:px-8 max-w-[1400px] mx-auto border-t border-stone-200/80">
        <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-2 block">
            Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display tracking-tight text-stone-900 mb-4">
            Built for modern engineering and project teams
          </h2>
          <p className="text-stone-600 text-base sm:text-lg">
            Everything you need to deliver high-impact projects with precision and clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-xs rounded-3xl p-6 lg:p-7 border border-stone-200/80 hover:border-stone-300 transition-all duration-300 flex flex-col justify-between group shadow-xs hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl font-display font-light text-stone-400">
                    {feature.number}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display tracking-tight text-stone-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-6">
                  {feature.description}
                </p>
              </div>

              {/* Rich Light White Background Visual Container */}
              <div className="h-56 w-full rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-2xs">
                <AnimatedVisual type={feature.visual} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== INTERACTIVE STEPS SECTION (ORIGINAL LAYOUT) ========== */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-stone-900 text-stone-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-3 block">
                Workflow
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display tracking-tight mb-8">
                From idea to delivery in three steps
              </h2>

              <div className="space-y-6">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${activeStep === idx
                        ? "bg-stone-800 border-stone-700 shadow-lg"
                        : "bg-stone-900/50 border-stone-800/50 hover:border-stone-800 opacity-60"
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs text-stone-400">{step.number}</span>
                      <h3 className="text-xl font-display tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-sm text-stone-400 leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              {/* Light Code Box Container */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xl font-mono text-xs text-stone-800">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-stone-500">taskflow-workflow.ts</span>
                  </div>
                  <span className="text-stone-400">Step {activeStep + 1} of 3</span>
                </div>
                <pre className="text-stone-800 overflow-x-auto p-4 bg-stone-50 rounded-xl border border-stone-200 leading-relaxed">
                  <code>{steps[activeStep].code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== LOCATIONS & METRICS SECTION (ORIGINAL LAYOUT) ========== */}
      <section id="infrastructure" className="py-24 lg:py-32 px-6 lg:px-8 max-w-[1400px] mx-auto border-t border-stone-200/80">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3 block">
            System Modules
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display tracking-tight text-stone-900 mb-6">
            Built for performance, scalability, and security
          </h2>
          <p className="text-stone-600 text-lg">
            High-availability workspace engine designed to support high-growth teams.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-20">
          {metrics.map((metric, i) => (
            <div key={i} className="text-center lg:text-left">
              <AnimatedCounter end={metric.value} suffix={metric.suffix} prefix={metric.prefix} />
              <p className="text-xs font-mono uppercase tracking-wider text-stone-500 mt-2">
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border transition-all duration-300 ${activeLocation === idx
                  ? "bg-white border-stone-300 shadow-md scale-[1.02]"
                  : "bg-white/40 border-stone-200/80 hover:bg-white/80"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-medium text-lg text-stone-900">{loc.city}</span>
                <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {loc.latency}
                </span>
              </div>
              <span className="text-xs text-stone-500 font-mono">{loc.region}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========== SECURITY SECTION (ORIGINAL LAYOUT) ========== */}
      <section className="py-24 lg:py-32 bg-stone-900 text-stone-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-3 block">
              Security & Access Control
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display tracking-tight mb-6">
              Enterprise-grade security built into every layer
            </h2>
            <p className="text-stone-400 text-lg">
              Bank-grade email OTP 2-factor authentication, JWT tokens, and granular access controls keep your project data safe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {securityFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-stone-800/50 p-6 rounded-2xl border border-stone-800">
                  <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-stone-300 mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-display text-lg tracking-tight mb-2">{feat.title}</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 border-t border-stone-800 pt-12">
            {certifications.map((cert, idx) => (
              <span key={idx} className="text-xs font-mono text-stone-400 tracking-wider">
                {cert}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING SECTION (ORIGINAL LAYOUT) ========== */}
      <section id="pricing" className="py-24 lg:py-32 px-6 lg:px-8 max-w-[1400px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3 block">
            Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display tracking-tight text-stone-900 mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-stone-600 text-lg">
            Start for free and scale as your team grows.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-xs font-mono ${!isAnnual ? "text-stone-900 font-bold" : "text-stone-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-stone-300 p-1 cursor-pointer transition-colors relative"
            >
              <div
                className={`w-4 h-4 rounded-full bg-stone-900 transition-transform ${isAnnual ? "translate-x-6" : "translate-x-0"
                  }`}
              />
            </button>
            <span className={`text-xs font-mono ${isAnnual ? "text-stone-900 font-bold" : "text-stone-500"}`}>
              Annual <span className="text-xs text-emerald-600">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-3xl p-8 lg:p-10 border flex flex-col justify-between transition-all duration-300 relative ${plan.popular
                  ? "border-stone-900 shadow-xl scale-[1.02]"
                  : "border-stone-200/80 shadow-xs hover:border-stone-300"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-stone-900 text-white text-[10px] font-mono uppercase tracking-wider">
                  Popular
                </div>
              )}

              <div>
                <h3 className="text-2xl font-display tracking-tight text-stone-900 mb-2">{plan.name}</h3>
                <p className="text-xs text-stone-500 mb-6">{plan.description}</p>
                <div className="mb-6">
                  {plan.price.monthly !== null ? (
                    <>
                      <span className="text-4xl font-display text-stone-900">
                        ${isAnnual ? plan.price.annual : plan.price.monthly}
                      </span>
                      <span className="text-xs text-stone-500 font-mono"> / month</span>
                    </>
                  ) : (
                    <span className="text-4xl font-display text-stone-900">Custom</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8 text-xs text-stone-600">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5">
                      <Check size={16} className="text-stone-900 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link to="/register">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full justify-center"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ========== CALL TO ACTION WITH TETRAHEDRON (ORIGINAL LAYOUT) ========== */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 max-w-[1400px] mx-auto">
        <div className="bg-stone-900 text-stone-50 rounded-3xl p-10 lg:p-20 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display tracking-tight mb-6">
                Ready to elevate your project productivity?
              </h2>
              <p className="text-stone-400 text-lg mb-8 max-w-xl">
                Join hundreds of engineering and management teams delivering better projects faster with TaskFlow.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-stone-900 hover:bg-stone-100">
                    Start for free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="border-stone-700 text-white hover:bg-stone-800">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 hidden lg:block">
              <div className="w-64 h-64 mx-auto">
                <AnimatedTetrahedron />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <PublicFooter />
    </main>
  );
};

export default HomePage;
