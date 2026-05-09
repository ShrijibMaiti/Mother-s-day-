/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Target, 
  Book, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Edit3,
  Plus,
  Trash2,
  X,
  Pencil,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { format, isYesterday, isToday, differenceInDays } from 'date-fns';

const STAGES = [
  "Topic Finalized",
  "Proposal Submitted",
  "Data Collection",
  "Analysis",
  "Writing",
  "Submission",
  "Viva"
];

const CHAPTER_STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-[#F3F4F6] text-[#6B7280]',
  'In Progress': 'bg-[#EAE4F4] text-[#7D6F9B]',
  'Draft Done': 'bg-[#E3ECE5] text-[#6E8B76]',
  'Final': 'bg-[#D1FAE5] text-[#065F46]'
};

export function PhDTracker() {
  const { user } = useAuth();
  const now = new Date();
  const [overview, setOverview] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [justSavedChapterId, setJustSavedChapterId] = useState<string | null>(null);
  const [chapterDeleteConfirm, setChapterDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Real-time syncing
  useEffect(() => {
    if (!user) return;

    const overviewUnsub = onSnapshot(doc(db, 'users', user.uid, 'phd', 'overview'), (snapshot) => {
      if (snapshot.exists()) {
        setOverview(snapshot.data());
      } else {
        const initial = {
          title: "PhD Thesis Title",
          university: "University Name",
          guideName: "Guide Name",
          targetDate: new Date(2026, 11, 31).toISOString(),
          currentStage: "Topic Finalized",
          dailyWordGoal: 500,
          writingStreak: 0,
          lastWritingDate: null
        };
        setDoc(doc(db, 'users', user.uid, 'phd', 'overview'), initial);
      }
    });

    const chaptersUnsub = onSnapshot(query(collection(db, 'users', user.uid, 'chapters'), orderBy('number', 'asc')), (snap) => {
      setChapters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const deadlinesUnsub = onSnapshot(query(collection(db, 'users', user.uid, 'phdDeadlines'), orderBy('date', 'asc')), (snap) => {
      setDeadlines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const todosUnsub = onSnapshot(collection(db, 'users', user.uid, 'phdTodos'), (snap) => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      overviewUnsub();
      chaptersUnsub();
      deadlinesUnsub();
      todosUnsub();
    };
  }, [user]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMetGoal = async () => {
    if (!user || !overview) return;
    const lastDate = overview.lastWritingDate ? new Date(overview.lastWritingDate) : null;
    let newStreak = overview.writingStreak || 0;
    if (lastDate && isToday(lastDate)) return;
    if (lastDate && isYesterday(lastDate)) newStreak += 1;
    else newStreak = 1;
    await updateDoc(doc(db, 'users', user.uid, 'phd', 'overview'), {
      writingStreak: newStreak,
      lastWritingDate: new Date().toISOString()
    });
  };

  const handleAddChapter = async () => {
    if (!user) return;
    const nextNum = chapters.length > 0 ? Math.max(...chapters.map(c => c.number || 0)) + 1 : 1;
    const newChapter = {
      number: nextNum,
      title: 'New Chapter',
      status: 'Not Started',
      lastEdited: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'users', user.uid, 'chapters'), newChapter);
    setEditingChapterId(docRef.id);
  };

  const updateChapter = async (id: string, data: any) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'chapters', id), {
      ...data,
      lastEdited: serverTimestamp()
    });
    setJustSavedChapterId(id);
    setTimeout(() => setJustSavedChapterId(null), 1000);
  };

  const deleteChapter = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'chapters', id));
    setChapterDeleteConfirm(null);
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'phdTodos', id), { completed: !completed });
  };

  if (!overview) return null;

  const currentStageIndex = STAGES.indexOf(overview.currentStage);
  const progressPercent = Math.round(((currentStageIndex + 1) / STAGES.length) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-semibold text-primary-text mb-2 text-balance">PhD Tracker</h1>
          <p className="text-secondary-text italic text-[15px]">Every word written is a step closer. Keep going, Prof. Samanta. 🎓</p>
        </div>
      </header>

      {/* Overview Card */}
      <div className="bg-white rounded-[24px] border border-border-card p-8 shadow-sm flex flex-col md:flex-row gap-8 relative overflow-hidden group">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] block mb-2">Research Title</label>
              <h2 className="text-2xl font-semibold text-primary-text leading-tight pr-10">
                "{overview.title}"
              </h2>
            </div>
            <button 
              onClick={() => setIsOverviewModalOpen(true)}
              className="absolute top-8 right-8 p-2 rounded-xl hover:bg-brand-bg transition-all text-secondary-text group-hover:text-primary-text"
            >
              <Edit3 size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[15px]">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">University</span>
              <p className="font-medium text-primary-text">{overview.university}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Guide</span>
              <p className="font-medium text-primary-text">{overview.guideName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Target Date</span>
              <p className="font-medium text-primary-text">{format(new Date(overview.targetDate || new Date()), 'MMMM yyyy')}</p>
            </div>
          </div>

          <div className="pt-4">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] block mb-3">Current Academic Stage</label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage, i) => {
                const isPassed = i <= currentStageIndex;
                const isCurrent = i === currentStageIndex;
                return (
                  <div 
                    key={stage}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                      isCurrent ? 'bg-sage text-white shadow-lg shadow-sage/30 scale-105' :
                      isPassed ? 'bg-sage/10 text-sage' : 'bg-brand-bg text-[#9CA3AF]'
                    }`}
                  >
                    {stage}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 flex flex-col justify-center items-center p-6 bg-brand-bg rounded-[20px] text-center border border-divider">
            <div className="relative w-32 h-32 mb-4">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="64" cy="64" r="56" fill="none" stroke="#E7E7E2" strokeWidth="10" />
                 <circle 
                    cx="64" cy="64" r="56" fill="none" stroke="#7C9E87" strokeWidth="10" 
                    strokeDasharray={351.8} strokeDashoffset={351.8 * (1 - (progressPercent / 100))}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-primary-text">{progressPercent}%</span>
                  <span className="text-[10px] uppercase font-bold text-secondary-text tracking-widest mt-0.5">Journey</span>
               </div>
            </div>
            <p className="text-xs font-medium text-sage uppercase tracking-wider">You're making progress!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Writing Goal */}
        <div className="lg:col-span-1 bg-white rounded-[24px] border border-border-card p-7 shadow-sm">
           <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Clock className="text-lavender" size={20} /> Writing Progress
           </h3>
           <div className="space-y-8">
              <div 
                className={`p-6 rounded-[20px] border transition-all cursor-pointer flex items-center gap-4 ${overview.lastWritingDate && isToday(new Date(overview.lastWritingDate)) ? 'bg-sage/5 border-sage/20' : 'bg-brand-bg border-divider shadow-inner'}`}
                onClick={handleMetGoal}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${overview.lastWritingDate && isToday(new Date(overview.lastWritingDate)) ? 'bg-sage border-sage text-white shadow-lg shadow-sage/20' : 'bg-white border-divider'}`}>
                  {(overview.lastWritingDate && isToday(new Date(overview.lastWritingDate))) && <CheckCircle2 size={18} />}
                </div>
                <div className="flex-1">
                   <p className={`font-semibold ${overview.lastWritingDate && isToday(new Date(overview.lastWritingDate)) ? 'text-sage line-through' : 'text-primary-text'}`}>Met my goal today ✅</p>
                   {overview.writingStreak > 0 && (
                     <p className="text-sm text-secondary-text mt-0.5 font-medium">🔥 {overview.writingStreak}-day writing streak!</p>
                   )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Daily Goal: {overview.dailyWordGoal} words</label>
                   <button className="text-[10px] font-bold text-sage underline uppercase tracking-widest">Adjust</button>
                </div>
                <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                   <div className="h-full bg-sage w-[40%] rounded-full shadow-lg shadow-sage/20" />
                </div>
                <p className="text-xs text-secondary-text font-medium">Approximately 200 words drafted today</p>
              </div>
           </div>
        </div>

        {/* Chapter Tracker Build 6 */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-border-card p-7 shadow-sm overflow-hidden">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Chapter Progress</h3>
              <button 
                onClick={handleAddChapter}
                className="bg-brand-bg p-2 rounded-lg text-secondary-text hover:text-sage transition-all hover:bg-sage/10"
              >
                <Plus size={18} />
              </button>
           </div>
           
           <div className="overflow-x-auto border border-divider rounded-xl">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-brand-bg/50">
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] w-16">#</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Chapter Title</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] w-40">Status</th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider font-medium">
                  {chapters.map((chapter) => {
                    const isJustSaved = justSavedChapterId === chapter.id;
                    return (
                      <tr 
                        key={chapter.id} 
                        className={`group transition-all duration-500 ${isJustSaved ? 'bg-sage/10' : 'hover:bg-brand-bg/20'}`}
                      >
                        <td className="px-5 py-4 text-xs font-bold text-secondary-text">
                          {chapter.number.toString().padStart(2, '0')}
                        </td>
                        <td className="px-5 py-4 text-[15px] text-primary-text">
                          {editingChapterId === chapter.id ? (
                            <input 
                              autoFocus
                              defaultValue={chapter.title}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateChapter(chapter.id, { title: e.currentTarget.value });
                                  setEditingChapterId(null);
                                }
                              }}
                              onBlur={(e) => {
                                updateChapter(chapter.id, { title: e.currentTarget.value });
                                setEditingChapterId(null);
                              }}
                              className="w-full bg-white border-b border-sage outline-none py-0.5"
                            />
                          ) : (
                            <div 
                              onDoubleClick={() => setEditingChapterId(chapter.id)}
                              className="flex items-center gap-2 group/title cursor-text"
                            >
                              <span>{chapter.title}</span>
                              <button 
                                onClick={() => setEditingChapterId(chapter.id)}
                                className="opacity-0 group-hover/title:opacity-100 p-1 text-[#9CA3AF] hover:text-sage"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <select 
                            className={`
                              text-[10px] font-bold uppercase px-3 py-1.5 rounded-full tracking-wider outline-none cursor-pointer border-none appearance-none
                              ${CHAPTER_STATUS_COLORS[chapter.status] || 'bg-brand-bg text-secondary-text'}
                            `}
                            value={chapter.status}
                            onChange={(e) => updateChapter(chapter.id, { status: e.target.value })}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Draft Done">Draft Done</option>
                            <option value="Final">Final</option>
                          </select>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {chapterDeleteConfirm === chapter.id ? (
                            <div className="flex items-center justify-end gap-3 animate-in fade-in slide-in-from-right-2">
                               <button onClick={() => deleteChapter(chapter.id)} className="text-[11px] font-bold text-red-500 uppercase">Yes</button>
                               <button onClick={() => setChapterDeleteConfirm(null)} className="text-[11px] font-bold text-secondary-text uppercase">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                onClick={() => setChapterDeleteConfirm(chapter.id)}
                                className="p-1.5 text-[#9CA3AF] hover:text-red-500 transition-colors"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {chapters.length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-secondary-text italic text-sm">
                          Start your first chapter to begin tracing your path. 🌸
                       </td>
                     </tr>
                  )}
                </tbody>
             </table>
           </div>
        </div>
      </div>

      {/* Overview Modal Build 6 */}
      <AnimatePresence>
        {isOverviewModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#1A1A2E]/40 backdrop-blur-[4px]">
             <motion.div 
               initial={{ opacity: 0, scale: 0.97 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0, scale: 0.97 }}
               className="bg-white rounded-[24px] p-8 max-w-[520px] w-full shadow-[0_8px_32px_rgba(0,0,0,0.1)] space-y-6"
             >
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-semibold text-primary-text">Update PhD Plan</h3>
                   <button onClick={() => setIsOverviewModalOpen(false)} className="text-[#9CA3AF] hover:text-primary-text transition-colors p-1"><X size={24} /></button>
                </div>

                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    if (!user) return;
                    await updateDoc(doc(db, 'users', user.uid, 'phd', 'overview'), {
                      title: formData.get('title'),
                      university: formData.get('university'),
                      guideName: formData.get('guideName'),
                      targetDate: formData.get('targetDate'),
                      currentStage: formData.get('currentStage')
                    });
                    setIsOverviewModalOpen(false);
                    showToast("PhD plan updated! 🎓");
                  }}
                  className="space-y-5"
                >
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">PhD Title</label>
                      <textarea 
                        name="title" required
                        defaultValue={overview.title}
                        rows={2}
                        className="w-full p-4 rounded-xl border border-divider focus:border-sage outline-none transition-all text-sm resize-none"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">University</label>
                        <input name="university" defaultValue={overview.university} className="w-full h-11 px-4 rounded-xl border border-divider focus:border-sage outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Supervisor</label>
                        <input name="guideName" defaultValue={overview.guideName} className="w-full h-11 px-4 rounded-xl border border-divider focus:border-sage outline-none" />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Target Completion</label>
                        <input name="targetDate" type="date" defaultValue={overview.targetDate?.split('T')[0]} className="w-full h-11 px-4 rounded-xl border border-divider focus:border-sage outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Current Stage</label>
                        <select name="currentStage" defaultValue={overview.currentStage} className="w-full h-11 px-4 rounded-xl border border-divider bg-white outline-none">
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                   </div>
                   <button type="submit" className="w-full h-14 bg-sage text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-sage/20 mt-4 transition-all hover:bg-6B8E76">Update Plan 🌸</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-primary-text text-white px-6 py-3 rounded-full shadow-xl z-[200] flex items-center gap-2 font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Deadline Tracker */}
         <div className="bg-white rounded-[24px] border border-border-card p-7 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-semibold flex items-center gap-2"><Clock size={20} className="text-red-400" /> Key Deadlines</h3>
               <button 
                onClick={async () => {
                  const title = prompt("Deadline title:");
                  const date = prompt("Date (YYYY-MM-DD):");
                  if (title && date && user) {
                    await addDoc(collection(db, 'users', user.uid, 'phdDeadlines'), {
                      title, date: new Date(date).toISOString(), createdAt: serverTimestamp()
                    });
                  }
                }}
                className="text-sage font-bold text-xs uppercase tracking-widest hover:underline"
               >
                 + Add Deadline
               </button>
            </div>
            <div className="space-y-3">
               {deadlines.map(deadline => {
                 const daysLeft = differenceInDays(new Date(deadline.date), now);
                 const color = daysLeft < 7 ? 'border-l-red-500' : daysLeft < 30 ? 'border-l-amber-500' : 'border-l-sage';
                 const statusIconColor = daysLeft < 7 ? 'text-red-500' : daysLeft < 30 ? 'text-amber-500' : 'text-sage';
                 
                 return (
                   <div key={deadline.id} className={`flex items-center justify-between p-4 bg-brand-bg rounded-xl border-l-[6px] ${color} shadow-sm group`}>
                      <div className="flex items-center gap-3">
                         <AlertCircle size={18} className={statusIconColor} />
                         <div>
                            <p className="text-[15px] font-semibold text-primary-text">{deadline.title}</p>
                            <p className="text-xs text-secondary-text font-medium">{format(new Date(deadline.date), 'dd MMM yyyy')}</p>
                         </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                         <div className="text-right">
                            <p className={`text-[15px] font-bold leading-none ${statusIconColor}`}>{daysLeft < 0 ? '0' : daysLeft}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-text mt-0.5">days left</p>
                         </div>
                         <button onClick={() => deleteDoc(doc(db, 'users', user!.uid, 'phdDeadlines', deadline.id))} className="opacity-0 group-hover:opacity-100 text-secondary-text hover:text-red-500 transition-all p-1">
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                 );
               })}
               {deadlines.length === 0 && (
                 <div className="py-8 text-center text-secondary-text italic text-sm">
                    No deadlines set. Take a deep breath. 🌸
                 </div>
               )}
            </div>
         </div>

         {/* Research To-Do */}
         <div className="bg-white rounded-[24px] border border-border-card p-7 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-semibold flex items-center gap-2"><Target size={20} className="text-blue-gray" /> Research Tasks</h3>
               <button 
                  onClick={async () => {
                    const title = prompt("New task:");
                    if (title && user) {
                      await addDoc(collection(db, 'users', user.uid, 'phdTodos'), {
                        title, completed: false, createdAt: serverTimestamp()
                      });
                    }
                  }}
                  className="text-sage font-bold text-xs uppercase tracking-widest hover:underline"
               >
                 + New Task
               </button>
            </div>
            <div className="space-y-1">
               {todos.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(todo => (
                 <div 
                   key={todo.id} 
                   className="flex items-center gap-4 p-4 rounded-[14px] hover:bg-brand-bg transition-colors group cursor-pointer"
                 >
                   <div 
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${todo.completed ? 'bg-blue-gray border-blue-gray text-white' : 'bg-white border-divider group-hover:border-blue-gray'}`}
                   >
                      {todo.completed && <Check size={14} />}
                   </div>
                   <span 
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className={`text-[15px] font-medium flex-1 ${todo.completed ? 'text-secondary-text line-through' : 'text-primary-text'}`}
                   >
                    {todo.title}
                   </span>
                   <button onClick={() => deleteDoc(doc(db, 'users', user!.uid, 'phdTodos', todo.id))} className="opacity-0 group-hover:opacity-100 text-secondary-text hover:text-red-500 p-1">
                    <Trash2 size={16} />
                   </button>
                 </div>
               ))}
               {todos.length === 0 && (
                 <div className="py-12 text-center text-secondary-text italic text-sm">
                    No research tasks yet. Keep your academic goal in sight. 🌿
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
