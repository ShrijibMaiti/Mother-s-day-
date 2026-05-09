/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { format, isToday, differenceInDays } from 'date-fns';
import { 
  Cloud, 
  Quote as QuoteIcon, 
  Leaf, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Calendar,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { Task, UserProfile, Quote } from '../../types';
import { CATEGORY_COLORS } from '../../constants';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

interface DashboardProps {
  user: any;
  tasks: Task[];
  toggleTask: (id: string, completed: boolean) => void;
  quote: Quote;
}

export function Dashboard({ user: profile, tasks, toggleTask, quote }: DashboardProps) {
  const { user } = useAuth();
  const today = new Date();
  const pinnedTasks = tasks.filter(t => t.pinned);
  
  // Dynamic Stats State
  const [lecturesCount, setLecturesCount] = useState(0);
  const [phdDeadline, setPhdDeadline] = useState<{ title: string; days: number | null }>({ title: 'No upcoming deadline', days: null });
  const [tasksDoneToday, setTasksDoneToday] = useState({ done: 0, total: 0 });
  const [familyEvent, setFamilyEvent] = useState<{ name: string; days: number | null }>({ name: 'No upcoming events', days: null });

  const greeting = () => {
    const hour = today.getHours();
    if (hour >= 5 && hour < 12) return "Good morning, Prof. Samanta! 🌸";
    if (hour >= 12 && hour < 17) return "Good afternoon, Prof. Samanta! ☀️";
    if (hour >= 17 && hour < 21) return "Good evening, Prof. Samanta! 🌿";
    return "Rest well, Prof. Samanta. 🌙";
  };

  // Fetch Stats Data
  useEffect(() => {
    if (!user) return;

    // 1. Lectures This Week (from schedule - count total classes in the Mon-Sat week)
    const scheduleUnsubscribe = onSnapshot(collection(db, 'users', user.uid, 'schedule'), (snap) => {
      const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const count = snap.docs.filter(doc => weekDays.includes(doc.data().day)).length;
      setLecturesCount(count); 
    });

    // 2. PhD Deadline - find single nearest upcoming
    const phdDeadlineQuery = query(
      collection(db, 'users', user.uid, 'phdDeadlines'),
      where('date', '>', today.toISOString().split('T')[0]),
      orderBy('date', 'asc'),
      limit(1)
    );
    const phdUnsubscribe = onSnapshot(phdDeadlineQuery, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const deadlineDate = new Date(data.date);
        setPhdDeadline({
          title: data.title,
          days: Math.max(0, differenceInDays(deadlineDate, today))
        });
      } else {
        setPhdDeadline({ title: 'No deadlines set', days: null });
      }
    });

    // 3. Family Events - find smallest positive days remaining
    const familyEventUnsubscribe = onSnapshot(collection(db, 'users', user.uid, 'familyEvents'), (snap) => {
      let nearest: any = null;
      let minDays = Infinity;
      
      snap.forEach(doc => {
        const data = doc.data();
        let month, day;

        if (data.month !== undefined && data.day !== undefined) {
          month = data.month;
          day = data.day;
        } else if (data.date) {
          const eventDateArr = data.date.split('-'); // YYYY-MM-DD
          month = parseInt(eventDateArr[1]) - 1;
          day = parseInt(eventDateArr[2]);
        } else {
          return;
        }
        
        const nextDate = new Date(today.getFullYear(), month, day);
        if (nextDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
           nextDate.setFullYear(today.getFullYear() + 1);
        }
        
        const diff = differenceInDays(nextDate, new Date(today.getFullYear(), today.getMonth(), today.getDate()));
        if (diff < minDays) {
          minDays = diff;
          nearest = { ...data, days: diff };
        }
      });

      if (nearest) {
        const emoji = nearest.type === 'Birthday' ? '🎂' : nearest.type === 'Anniversary' ? '💍' : '🎉';
        setFamilyEvent({
          name: nearest.name,
          days: nearest.days,
          emoji: emoji
        });
      } else {
        setFamilyEvent({ name: 'No events added', days: null });
      }
    });

    return () => {
      scheduleUnsubscribe();
      phdUnsubscribe();
      familyEventUnsubscribe();
    };
  }, [user]);

  // Tasks Done Today Calculation
  useEffect(() => {
    const done = tasks.filter(t => t.completed && t.completedAt && isToday(new Date(t.completedAt))).length;
    const total = pinnedTasks.length;
    setTasksDoneToday({ done, total });
    
    if (total > 0 && done === total) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#7C9E87', '#A89BC2']
      });
    }
  }, [tasks, pinnedTasks.length]);

  return (
    <div className="max-w-[1240px] mx-auto animate-in fade-in duration-500">
      {/* Header Row */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-[56px] font-semibold text-primary-text leading-[1.05] tracking-tight mb-2">
            {greeting()}
          </h1>
          <p className="text-[16px] text-secondary-text font-normal italic">
            Senior Lecturer · Nursing · PhD Scholar in Progress
          </p>
          <p className="text-[20px] text-secondary-text font-normal mt-2">
            {format(today, 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        
        <div className="h-11 rounded-[14px] border border-border-main bg-white px-4 flex items-center gap-2 text-[15px] text-secondary-text shadow-sm">
          <Cloud className="w-5 h-5 text-blue-gray" />
          <span>31°C · {profile.city || 'Kolkata'}</span>
        </div>
      </header>

      {/* Quote Card */}
      <div className="bg-white rounded-[18px] border border-border-card shadow-sm border-l-4 border-l-sage p-[24px_28px] mb-6 relative overflow-hidden h-[130px] flex flex-col justify-center">
        <QuoteIcon className="text-sage w-5 h-5 mb-2 opacity-60" />
        <p className="text-[18px] text-primary-text leading-snug italic font-normal max-w-[70%]">
          "{quote.text}"
        </p>
        <p className="text-[14px] text-secondary-text mt-2 font-normal">— {quote.author}</p>
        
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.12] text-sage pointer-events-none">
          <Leaf size={100} />
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-[58fr_42fr] gap-6 items-start">
        {/* Today's Focus */}
        <div className="bg-white rounded-[18px] border border-border-card border-l-4 border-l-sage shadow-sm p-7 min-h-[420px]">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-[22px] font-semibold text-primary-text">Today's Focus</h2>
            <button className="text-secondary-text hover:text-primary-text transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[14px] text-secondary-text mb-6">Focus on these three. The rest can wait. 🌿</p>
          
          <div className="border-t border-divider">
            {pinnedTasks.length > 0 ? (
              pinnedTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-4 py-[18px] border-b border-divider group cursor-pointer"
                  onClick={() => toggleTask(task.id, task.completed)}
                >
                  <div 
                    className={`
                      w-7 h-7 rounded-lg border-[1.5px] transition-all flex items-center justify-center
                      ${task.completed 
                        ? 'bg-sage border-sage' 
                        : 'border-gray-300 group-hover:border-sage'
                      }
                    `}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[16px] font-medium flex-1 transition-colors ${task.completed ? 'text-secondary-text line-through' : 'text-primary-text'}`}>
                    {task.title}
                  </span>
                  <span className={`
                    text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md
                    ${CATEGORY_COLORS[task.category]?.bg} ${CATEGORY_COLORS[task.category]?.text}
                  `}>
                    {task.category}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                 <p className="text-secondary-text">Nothing pinned yet. Head to Task Manager to set your focus. 🌿</p>
              </div>
            )}
          </div>

          <p className="mt-8 text-[13px] text-[#9CA3AF] italic">
            You've got this, Prof. Samanta. 🌺
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            icon={<BookOpen size={22} />}
            value={lecturesCount.toString().padStart(2, '0')}
            label="Lectures This Week"
            accent="bg-sage"
            badgeBg="bg-[#E3ECE5]"
            badgeIconColor="text-sage"
          />
          <StatCard 
            icon={<GraduationCap size={22} />}
            value={phdDeadline.days !== null ? phdDeadline.days.toString() : '—'}
            label="PhD Days Left"
            subtitle={phdDeadline.title}
            accent="bg-lavender"
            badgeBg="bg-[#EAE4F4]"
            badgeIconColor="text-lavender"
          />
          <StatCard 
            icon={<CheckCircle2 size={22} />}
            value={`${tasksDoneToday.done} / ${tasksDoneToday.total}`}
            label="Tasks Done Today"
            accent="bg-[#81C995]"
            badgeBg="bg-[#E7F5E9]"
            badgeIconColor="text-[#81C995]"
          />
           <StatCard 
            icon={<Calendar size={22} />}
            value={familyEvent.days !== null ? familyEvent.name : '—'}
            label="Next Family Event"
            subtitle={familyEvent.days !== null ? `in ${familyEvent.days} days ${(familyEvent as any).emoji || '🎂'}` : familyEvent.name}
            accent="bg-beige"
            badgeBg="bg-[#FAF0E6]"
            badgeIconColor="text-beige"
            isTextValue={familyEvent.days !== null && familyEvent.name.length > 5}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-[64fr_36fr] gap-6 mt-6 pb-12">
        {/* Today's Schedule (Simplified for now) */}
        <div className="bg-white rounded-[18px] border border-border-card shadow-sm p-7">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-primary-text">Today's Schedule</h3>
            <button className="text-sage text-sm font-medium hover:underline">View full schedule</button>
          </div>
          
          <div className="text-center py-8">
             <p className="text-secondary-text">Check your full schedule in the Teaching Hub. 📚</p>
          </div>
        </div>

        {/* Milestone Card */}
        <div className="bg-white rounded-[18px] border border-border-card shadow-sm p-7 flex items-center gap-4 hover:translate-y-[-2px] transition-all cursor-pointer group">
          <div className="w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center text-lavender group-hover:bg-lavender/10 transition-colors">
            <GraduationCap size={28} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Upcoming Milestone</p>
            <h4 className="font-semibold text-[17px] text-primary-text mb-1">Thesis Submission</h4>
            <p className="text-sm text-lavender font-medium">{phdDeadline.days !== null ? `${phdDeadline.days} days remaining` : 'Set your goal'}</p>
          </div>
          <ChevronRight className="text-secondary-text opacity-30 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, accent, badgeBg, badgeIconColor, subtitle, isTextValue }: any) {
  return (
    <div className="bg-white rounded-[18px] border border-border-card shadow-sm p-6 h-[175px] flex flex-col justify-between hover:translate-y-[-2px] transition-all cursor-pointer group">
      <div className="flex items-start">
        <div className={`w-10 h-10 rounded-full ${badgeBg} ${badgeIconColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      
      <div>
        <div className={`font-semibold text-primary-text leading-none ${isTextValue ? 'text-[20px] mb-1 truncate' : 'text-[56px]'}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-[13px] text-secondary-text mt-1 truncate max-w-full">
            {subtitle}
          </p>
        )}
        <div className={`h-[3px] w-8 rounded-full mt-2 ${accent}`} />
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary-text">
        {label}
      </div>
    </div>
  );
}
