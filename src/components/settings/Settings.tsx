/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Cloud, 
  CreditCard, 
  ChevronRight, 
  GraduationCap, 
  LogOut,
  Save,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  user: UserProfile;
}

export function Settings({ user: profile }: SettingsProps) {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'profile', 'default'), { ...formData });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out? 🌸")) {
      await logout();
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-primary-text mb-2">Settings</h1>
          <p className="text-secondary-text">Personalize your Command Center experience. ⚙️</p>
        </div>
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 text-sage bg-sage/10 px-4 py-2 rounded-xl border border-sage/20 font-medium"
            >
              <CheckCircle2 size={18} />
              Changes saved successfully
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          {/* Profile Section */}
          <section className="bg-white rounded-[24px] border border-border-card p-10 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start mb-10">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <User size={22} className="text-sage" /> Personal Profile
                </h3>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-sage text-white px-6 h-11 rounded-xl font-medium flex items-center gap-2 hover:bg-sage/90 disabled:opacity-50 transition-all shadow-lg shadow-sage/20"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
             </div>
             
             <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-12">
                <div className="relative group">
                   <div className="w-32 h-32 rounded-[32px] bg-brand-bg border-2 border-divider flex items-center justify-center overflow-hidden transition-all group-hover:border-sage shadow-inner">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-[#9CA3AF]">US</span>
                      )}
                      <div className="absolute inset-0 bg-primary-text/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                         <Cloud className="text-white" size={24} />
                      </div>
                   </div>
                   <p className="text-center mt-3 text-[11px] font-bold uppercase tracking-widest text-secondary-text">Edit Photo</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full h-12 bg-brand-bg border border-divider rounded-xl px-4 text-[15px] focus:border-sage focus:bg-white outline-none transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Your Role</label>
                      <input 
                        type="text" 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-full h-12 bg-brand-bg border border-divider rounded-xl px-4 text-[15px] focus:border-sage focus:bg-white outline-none transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Workplace / College</label>
                      <input 
                        type="text" 
                        value={formData.college} 
                        onChange={e => setFormData({...formData, college: e.target.value})}
                        className="w-full h-12 bg-brand-bg border border-divider rounded-xl px-4 text-[15px] focus:border-sage focus:bg-white outline-none transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">City</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        className="w-full h-12 bg-brand-bg border border-divider rounded-xl px-4 text-[15px] focus:border-sage focus:bg-white outline-none transition-all font-medium"
                      />
                   </div>
                </div>
             </div>
          </section>

          {/* Academic Info */}
          <section className="bg-white rounded-[24px] border border-border-card p-10 shadow-sm">
             <h3 className="text-xl font-semibold mb-10 flex items-center gap-2">
               <GraduationCap size={22} className="text-lavender" /> Academic & PhD Info
             </h3>
             
             <div className="space-y-8">
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">PhD Research Title</label>
                   <textarea 
                     value={formData.phdTitle}
                     onChange={e => setFormData({...formData, phdTitle: e.target.value})}
                     className="w-full bg-brand-bg border border-divider rounded-[18px] p-5 text-[16px] focus:border-sage focus:bg-white outline-none min-h-[100px] transition-all font-medium leading-relaxed"
                   />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Affiliated University</label>
                      <input 
                        type="text" 
                        value={formData.university} 
                        onChange={e => setFormData({...formData, university: e.target.value})}
                        className="w-full h-12 bg-brand-bg border border-divider rounded-xl px-4 text-[15px] focus:border-sage focus:bg-white outline-none transition-all font-medium" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">PhD Guide Name</label>
                      <input 
                        type="text" 
                        value={formData.guideName} 
                        onChange={e => setFormData({...formData, guideName: e.target.value})}
                        className="w-full h-12 bg-brand-bg border border-divider rounded-xl px-4 text-[15px] focus:border-sage focus:bg-white outline-none transition-all font-medium" 
                      />
                   </div>
                </div>
             </div>
          </section>
        </div>

        {/* Sidebar Options */}
        <div className="space-y-4">
           <div className="bg-white rounded-[24px] border border-border-card p-4 shadow-sm flex flex-col gap-1">
              <SettingsNavItem icon={<Bell size={18} />} label="Notifications" />
              <SettingsNavItem icon={<Shield size={18} />} label="Security" />
              <SettingsNavItem icon={<CreditCard size={18} />} label="Subscription" active />
              <SettingsNavItem icon={<Cloud size={18} />} label="Data & Backup" />
              <div className="h-px bg-divider my-2" />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-all"
              >
                 <LogOut size={18} />
                 Sign Out
              </button>
           </div>

           <div className="bg-brand-bg rounded-[24px] p-8 space-y-4 border border-divider">
              <h4 className="font-bold text-xs uppercase tracking-widest text-secondary-text">App Info</h4>
              <div className="space-y-2 text-sm text-secondary-text">
                 <p className="flex justify-between"><span>Version</span> <span className="font-medium text-primary-text">1.0.4-gold</span></p>
                 <p className="flex justify-between"><span>Sync Status</span> <span className="text-sage font-medium">Online</span></p>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
}

function SettingsNavItem({ icon, label, active }: any) {
  return (
    <button className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${active ? 'bg-brand-bg' : 'hover:bg-brand-bg/50'}`}>
      <div className="flex items-center gap-3 text-secondary-text group-hover:text-primary-text font-medium text-[15px]">
        <span className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
        {label}
      </div>
      <ChevronRight size={16} className="text-secondary-text opacity-30 group-hover:opacity-100" />
    </button>
  );
}
