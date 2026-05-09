/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Calendar, Tag as TagIcon, MoreHorizontal, Pin, PinOff, Trash2, X, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Task } from '../../types';
import { CATEGORY_COLORS, PRIORITY_COLORS } from '../../constants';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';

interface TaskManagerProps {
  tasks: Task[];
  toggleTask: (id: string, completed: boolean) => void;
}

export function TaskManager({ tasks, toggleTask }: TaskManagerProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reflectionSubmitting, setReflectionSubmitting] = useState(false);
  const [todayReflection, setTodayReflection] = useState<any>(null);
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'Teaching' as Task['category'],
    priority: 'ThisWeek' as Task['priority'],
    dueDate: '',
    notes: '',
    pinned: false
  });

  // Reflection logic - check if it's after 5 PM
  const now = new Date();
  const isReflectionTime = now.getHours() >= 17;
  const todayKey = format(now, 'yyyy-MM-dd');

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'reflections', todayKey), (doc) => {
      if (doc.exists()) setTodayReflection(doc.data());
    });
    return () => unsub();
  }, [user, todayKey]);

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'All' || t.category === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch && !t.completed;
  });

  const completedTasks = tasks.filter(t => t.completed);
  const pinnedTasks = tasks.filter(t => t.pinned && !t.completed);

  const togglePin = async (id: string, currentlyPinned: boolean) => {
    if (!user) return;
    if (!currentlyPinned && pinnedTasks.length >= 3) {
      showToast("Today's Focus is full. Complete a task first. 🌿");
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { pinned: !currentlyPinned });
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure? This can't be undone.")) {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
    }
  };

  const saveReflection = async (content: string, mood: number) => {
    if (!user) return;
    setReflectionSubmitting(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'reflections', todayKey), {
        id: todayKey,
        date: todayKey,
        content,
        mood,
        createdAt: serverTimestamp()
      });
      showToast("Reflection saved! 🌸");
    } finally {
      setReflectionSubmitting(false);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        ...newTask,
        completed: false,
        createdAt: serverTimestamp(),
        completedAt: null
      });
      showToast("Task added! 🌸");
      setNewTask({ title: '', category: 'Teaching', priority: 'ThisWeek', dueDate: '', notes: '', pinned: false });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const categories: Task['category'][] = ['Teaching', 'Research', 'Admin', 'Personal'];
  const priorities: { value: Task['priority']; label: string }[] = [
    { value: 'Urgent', label: '🔴 Urgent' },
    { value: 'ThisWeek', label: '🟡 This Week' },
    { value: 'Someday', label: '🟢 Someday' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Search Area */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-primary-text mb-2 text-balance">Task Manager</h1>
            <p className="text-secondary-text">Organize your thoughts, one task at a time. ✅</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-sage text-white px-6 h-12 rounded-xl font-medium flex items-center gap-2 hover:bg-sage/90 hover:-translate-y-0.5 transition-all shadow-lg shadow-sage/20 shrink-0"
          >
            <Plus size={20} /> Add New Task
          </button>
        </div>

        {/* Search Bar Build 3 */}
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-10 bg-white border border-[#E7E7E2] rounded-xl text-[15px] focus:border-[#7C9E87] focus:ring-2 focus:ring-[#7C9E87]/10 outline-none transition-all placeholder:text-[#9CA3AF]"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9CA3AF] hover:text-primary-text transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

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

      {/* Today's Focus Block */}
      <div className="bg-white rounded-[24px] border-l-4 border-sage p-7 shadow-sm">
         <h3 className="text-[17px] font-semibold text-primary-text mb-1">Today's Focus</h3>
         <p className="text-xs text-secondary-text mb-4">Max 3 pinned tasks for the day.</p>
         
         <div className="space-y-2">
            {pinnedTasks.length > 0 ? (
              pinnedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-4 bg-brand-bg rounded-xl group">
                   <button onClick={() => toggleTask(task.id, task.completed)} className="w-5 h-5 rounded border border-sage flex items-center justify-center">
                      {task.completed && <CheckCircle2 size={12} className="text-sage" />}
                   </button>
                   <span className="text-[15px] font-medium flex-1">{task.title}</span>
                   <button onClick={() => togglePin(task.id, true)} className="text-sage hover:text-red-500" title="Unpin">
                      <PinOff size={16} />
                   </button>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-secondary-text text-sm italic">Nothing pinned yet. 🌿</p>
            )}
         </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-divider p-1.5 flex items-center gap-2">
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {['All', 'Teaching', 'Research', 'Admin', 'Personal'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                ${filter === f 
                  ? 'bg-active-nav-bg text-active-nav-text' 
                  : 'text-secondary-text hover:bg-brand-bg'
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-border-card shadow-sm overflow-hidden">
        <div className="divide-y divide-divider">
          {filteredTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-6 p-5 hover:bg-brand-bg/50 transition-colors group">
              <button 
                onClick={() => toggleTask(task.id, task.completed)}
                className={`
                  w-6 h-6 rounded-md border-[1.5px] flex items-center justify-center transition-all
                  ${task.completed ? 'bg-sage border-sage text-white' : 'border-divider group-hover:border-sage'}
                `}
              >
                {task.completed && <CheckCircle2 size={14} />}
              </button>
              
              <div className="flex-1 flex items-center gap-3">
                 <span className={`text-[16px] font-medium transition-all ${task.completed ? 'text-secondary-text line-through' : 'text-primary-text'}`}>
                    {task.title}
                 </span>
                 {task.pinned && <Pin size={14} className="text-sage rotate-45" />}
              </div>

              <div className="flex items-center gap-4">
                {task.dueDate && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-secondary-text bg-brand-bg px-2.5 py-1 rounded-full uppercase tracking-widest">
                    <Calendar size={14} />
                    <span>{format(new Date(task.dueDate), 'dd MMM')}</span>
                  </div>
                )}
                
                <span className={`
                  text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md
                  ${CATEGORY_COLORS[task.category]?.bg} ${CATEGORY_COLORS[task.category]?.text}
                `}>
                  {task.category}
                </span>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => togglePin(task.id, !!task.pinned)} className={`p-1.5 rounded-lg hover:bg-white transition-all ${task.pinned ? 'text-sage' : 'text-secondary-text'}`}>
                      <Pin size={16} className={task.pinned ? 'fill-sage' : ''} />
                   </button>
                   <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-white text-secondary-text hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                   </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="p-16 text-center text-secondary-text">
               <p className="italic">{search ? "No tasks match your search. 🌿" : "All clear for now. Enjoy the moment. 🌿"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Archived Section */}
      <div className="pt-4">
         <button 
           onClick={() => setShowCompleted(!showCompleted)}
           className="flex items-center gap-2 text-secondary-text hover:text-primary-text font-medium text-sm transition-all"
         >
           {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
           Archived Tasks ({completedTasks.length})
         </button>
         
         <AnimatePresence>
           {showCompleted && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden mt-4 space-y-2"
             >
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-4 bg-white/50 rounded-xl opacity-60 border border-divider">
                     <button onClick={() => toggleTask(task.id, true)} className="w-5 h-5 rounded bg-sage border border-sage flex items-center justify-center text-white">
                        <CheckCircle2 size={12} />
                     </button>
                     <span className="text-sm font-medium line-through flex-1">{task.title}</span>
                     <button onClick={() => deleteTask(task.id)} className="text-secondary-text hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* End-of-Day Reflection Build 4 */}
      <AnimatePresence>
        {isReflectionTime && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pt-8"
          >
             {todayReflection && !isEditingReflection ? (
               <ReflectionSummary 
                reflection={todayReflection} 
                onEdit={() => setIsEditingReflection(true)} 
               />
             ) : (
               <ReflectionForm 
                initialData={todayReflection}
                onSave={(content, mood) => {
                  saveReflection(content, mood);
                  setIsEditingReflection(false);
                }} 
               />
             )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1A2E]/40 backdrop-blur-[4px] animate-in fade-in duration-200">
             <motion.div 
               initial={{ opacity: 0, scale: 0.97 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0, scale: 0.97 }}
               className="bg-white rounded-[20px] p-8 max-w-[480px] w-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col gap-6"
             >
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-semibold text-primary-text">Add New Task</h3>
                   <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="text-secondary-text hover:text-primary-text transition-colors p-1"
                   >
                    <X size={24} />
                   </button>
                </div>
                
                <form onSubmit={handleAddTask} className="space-y-6">
                   {/* Title */}
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Task Title</label>
                      <input 
                        type="text" 
                        required
                        autoFocus
                        value={newTask.title} 
                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl border border-border-main focus:border-sage focus:ring-2 focus:ring-sage focus:outline-none transition-all placeholder:text-gray-300"
                        placeholder="What needs to be done?"
                      />
                   </div>
                   
                   {/* Category - Segmented Selector */}
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Category</label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewTask({...newTask, category: cat})}
                            className={`
                              h-10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border
                              ${newTask.category === cat 
                                ? `${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text} border-transparent shadow-sm` 
                                : 'bg-white text-secondary-text border-border-main hover:bg-brand-bg'}
                            `}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Priority - Segmented Selector */}
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Priority</label>
                      <div className="flex gap-2">
                        {priorities.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setNewTask({...newTask, priority: p.value})}
                            className={`
                              flex-1 h-10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border
                              ${newTask.priority === p.value 
                                ? `${PRIORITY_COLORS[p.value].bg} ${PRIORITY_COLORS[p.value].text} border-transparent shadow-sm` 
                                : 'bg-white text-secondary-text border-border-main hover:bg-brand-bg'}
                            `}
                          >
                            {p.label.split(' ')[1]}
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      {/* Due Date */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Due Date (Optional)</label>
                        <input 
                          type="date"
                          value={newTask.dueDate || ''} 
                          onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                          className="w-full h-11 px-4 rounded-xl border border-border-main focus:border-sage focus:outline-none transition-all text-sm bg-white"
                        />
                      </div>
                      
                      {/* Pinned Toggle */}
                      <div className="space-y-2">
                         <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Today's Focus</label>
                         <button
                           type="button"
                           disabled={pinnedTasks.length >= 3 && !newTask.pinned}
                           onClick={() => setNewTask({...newTask, pinned: !newTask.pinned})}
                           className={`
                             w-full h-11 rounded-xl border flex items-center justify-center gap-2 transition-all text-sm font-medium
                             ${newTask.pinned 
                               ? 'bg-sage text-white border-sage' 
                               : 'bg-white text-secondary-text border-border-main hover:bg-brand-bg'}
                             ${pinnedTasks.length >= 3 && !newTask.pinned ? 'opacity-50 cursor-not-allowed' : ''}
                           `}
                           title={pinnedTasks.length >= 3 && !newTask.pinned ? "Today's Focus is full. Complete a task first. 🌿" : ""}
                         >
                           <Pin size={16} />
                           {newTask.pinned ? 'Pinned' : 'Pin Task'}
                         </button>
                      </div>
                   </div>

                   {/* Notes */}
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Notes (Optional)</label>
                      <textarea 
                        rows={3}
                        value={newTask.notes || ''} 
                        onChange={e => setNewTask({...newTask, notes: e.target.value})}
                        className="w-full p-4 rounded-xl border border-border-main focus:border-sage focus:outline-none transition-all placeholder:text-gray-300 text-sm resize-none"
                        placeholder="Any additional notes..."
                      />
                   </div>

                   <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 h-12 rounded-[12px] font-semibold text-secondary-text border border-border-main hover:bg-brand-bg transition-all"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 h-12 bg-sage text-white rounded-[12px] font-semibold hover:bg-6B8E76 hover:-translate-y-0.5 transition-all shadow-lg shadow-sage/20"
                      >
                         Save Task
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReflectionForm({ onSave, initialData }: { onSave: (c: string, m: number) => void, initialData?: any }) {
  const [content, setContent] = useState(initialData?.content || '');
  const [mood, setMood] = useState(initialData?.mood || 0);

  return (
    <div className="bg-white rounded-[18px] border border-[#E7E7E2] border-l-4 border-l-[#A89BC2] p-7 md:p-8 shadow-sm space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[#1A1A2E]">How did today go, Prof. Samanta? 🌙</h3>
            <p className="text-sm text-[#6B7280] italic">Take a moment. You've earned it.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] text-[#6B7280] text-right md:text-left">How are you feeling? 🌸</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((m, i) => {
                const emojis = ['😔', '😐', '🙂', '😊', '🌟'];
                return (
                  <button 
                    key={m} 
                    type="button"
                    onClick={() => setMood(m)}
                    className={`
                      w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all duration-150
                      hover:scale-105 border border-[#E7E7E2]
                      ${mood === m 
                        ? 'border-2 border-[#7C9E87] bg-[#EEF4F0] scale-110' 
                        : 'bg-white hover:bg-[#F7F7F4]'}
                    `}
                  >
                    {emojis[i]}
                  </button>
                );
              })}
            </div>
          </div>
       </div>

       <textarea 
         value={content}
         onChange={(e) => setContent(e.target.value)}
         placeholder="What did I accomplish today? What's on my mind?"
         className="w-full min-h-[120px] p-4 rounded-xl border border-[#E7E7E2] focus:border-sage focus:outline-none transition-all text-[15px] resize-none"
       />

       <button 
         disabled={!content || mood === 0}
         onClick={() => onSave(content, mood)}
         className="w-full h-12 bg-sage text-white rounded-xl font-medium hover:bg-[#6B8E76] disabled:opacity-50 transition-all shadow-lg shadow-sage/10"
       >
         Save Reflection 🌸
       </button>
    </div>
  );
}

function ReflectionSummary({ reflection, onEdit }: { reflection: any, onEdit: () => void }) {
  const emojis = ['😔', '😐', '🙂', '😊', '🌟'];
  const moodEmoji = emojis[reflection.mood - 1];
  
  // Format time safely, handle serverTimestamp null state if fresh
  const time = reflection.createdAt && reflection.createdAt.toDate ? 
    format(reflection.createdAt.toDate(), 'h:mm a') : 
    format(new Date(), 'h:mm a');

  return (
    <div className="bg-white rounded-[18px] border border-[#E7E7E2] border-l-4 border-l-[#A89BC2] p-7 md:p-8 shadow-sm space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-[#1A1A2E]">Today's reflection 🌙</h3>
          <p className="text-[13px] text-[#9CA3AF]">Saved at {time}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl">{moodEmoji}</span>
        </div>
      </div>
      
      <div className="bg-[#FAFAF8] rounded-xl p-4 border border-[#F1F1ED] italic text-[#6B7280] leading-relaxed">
        "{reflection.content}"
      </div>
      
      <button 
        onClick={onEdit}
        className="text-sm font-medium text-sage hover:text-[#6B8E76] transition-colors flex items-center gap-1.5"
      >
        Edit reflection
      </button>
    </div>
  );
}
