import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  CheckSquare, 
  Users, 
  Settings, 
  Leaf,
  ChevronRight,
  ChevronUp,
  LogOut
} from 'lucide-react';
import { Page } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  user: any;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'teaching' as Page, label: 'Teaching Hub', icon: BookOpen },
  { id: 'phd' as Page, label: 'PhD Tracker', icon: GraduationCap },
  { id: 'tasks' as Page, label: 'Task Manager', icon: CheckSquare },
  { id: 'family' as Page, label: 'Family Corner', icon: Users },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, setPage, user }: SidebarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <aside id="sidebar" className="fixed left-0 top-0 w-[260px] h-screen bg-sidebar-bg border-r border-border-main p-7 flex flex-col z-50">
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-active-nav-bg rounded-xl flex items-center justify-center">
          <Leaf className="text-sage w-6 h-6" />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-primary-text leading-none">My Command Center</h1>
          <p className="text-[14px] text-secondary-text mt-1">Your space. Your pace. 🌸</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`
                h-14 rounded-[14px] px-[18px] flex items-center gap-3 transition-all duration-180 group cursor-pointer
                ${isActive 
                  ? 'bg-active-nav-bg text-active-nav-text font-medium' 
                  : 'bg-transparent text-secondary-text hover:bg-nav-hover'
                }
              `}
            >
              <Icon 
                className={`w-[22px] h-[22px] ${isActive ? 'text-active-nav-text' : 'text-secondary-text'}`} 
              />
              <span className="text-[17px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="relative" ref={dropdownRef}>
        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute bottom-[80px] left-0 right-0 bg-white border border-[#E7E7E2] rounded-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-[6px] z-50 overflow-hidden"
            >
              <button
                onClick={() => {
                  setPage('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full h-11 px-3 rounded-[10px] flex items-center gap-[10px] cursor-pointer transition-colors hover:bg-[#F7F7F4] text-left"
              >
                <Settings className="w-4 h-4 text-sage" />
                <span className="text-[15px] font-medium text-[#1A1A2E]">Profile & Settings</span>
              </button>
              
              <div className="h-[1px] bg-[#F1F1ED] my-[6px] mx-1" />
              
              <button
                onClick={handleSignOut}
                className="w-full h-11 px-3 rounded-[10px] flex items-center gap-[10px] cursor-pointer transition-colors hover:bg-[#FEF2F2] text-left"
              >
                <LogOut className="w-4 h-4 text-[#E57373]" />
                <span className="text-[15px] font-medium text-[#E57373]">Sign Out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="mt-6 pt-6 border-t border-border-main flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-beige/20 border border-border-main overflow-hidden flex items-center justify-center shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-secondary-text font-medium text-sm">
                {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-primary-text truncate">{user?.name || 'User'}</p>
            <p className="text-[12px] text-secondary-text truncate">{user?.role || 'Professor'}</p>
          </div>
          {isProfileOpen ? (
            <ChevronUp className="w-4 h-4 text-sage opacity-100 transition-all" />
          ) : (
            <ChevronRight className="w-4 h-4 text-secondary-text opacity-40 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </aside>
  );
}
