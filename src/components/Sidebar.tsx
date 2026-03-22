import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  CalendarCheck, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" 
        : "text-slate-400 dark:text-slate-400 light:text-slate-600 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-200 hover:text-white dark:hover:text-white light:hover:text-slate-900"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 dark:text-slate-400 light:text-slate-600 group-hover:text-brand-accent")} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Sidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/destinations", icon: MapPin, label: "Destinations" },
    { to: "/bookings", icon: CalendarCheck, label: "Bookings" },
    { to: "/travelers", icon: Users, label: "Travelers", adminOnly: true },
    { to: "/payments", icon: CreditCard, label: "Payments" },
    { to: "/reports", icon: BarChart3, label: "Reports", adminOnly: true },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-brand-card glass rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-brand-bg/95 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center shadow-lg shadow-brand-accent/30">
              <MapPin className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gradient">Sanyog Yatra</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {filteredItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                active={location.pathname === item.to}
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <button 
              onClick={() => auth.signOut()}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
};
