/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Gift, 
  ListTodo, 
  ShoppingCart, 
  StickyNote, 
  Plus, 
  Bell, 
  Trash2, 
  CheckCircle2, 
  X,
  Heart,
  ChevronRight,
  Check,
  Pencil,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { FamilyEvent, FamilyTodo } from '../../types';
import { format, differenceInDays } from 'date-fns';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const GROCERY_CATEGORIES = [
  { id: 'veggies', label: '🥦 Vegetables', color: 'bg-green-50 text-green-700' },
  { id: 'dairy', label: '🥛 Dairy', color: 'bg-blue-50 text-blue-700' },
  { id: 'meds', label: '💊 Medicines', color: 'bg-red-50 text-red-700' },
  { id: 'household', label: '🧹 Household', color: 'bg-amber-50 text-amber-700' },
  { id: 'other', label: '🛒 Other', color: 'bg-gray-50 text-gray-700' }
];

export function FamilyCorner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'todo' | 'grocery'>('todo');
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [todos, setTodos] = useState<FamilyTodo[]>([]);
  const [homeNote, setHomeNote] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [inputTodo, setInputTodo] = useState('');
  const [groceryCategory, setGroceryCategory] = useState('other');
  const [toast, setToast] = useState<string | null>(null);

  const today = new Date();

  // Real-time syncing
  useEffect(() => {
    if (!user) return;

    const eventsUnsub = onSnapshot(collection(db, 'users', user.uid, 'familyEvents'), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyEvent)));
    });

    const todosUnsub = onSnapshot(query(collection(db, 'users', user.uid, 'familyTodos'), orderBy('createdAt', 'desc')), (snap) => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyTodo)));
    });

    const notesUnsub = onSnapshot(doc(db, 'users', user.uid, 'homeNotes', 'main'), (doc) => {
      if (doc.exists()) setHomeNote(doc.data().content);
    });

    return () => {
      eventsUnsub();
      todosUnsub();
      notesUnsub();
    };
  }, [user]);

  // Debounced save for home notes
  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(async () => {
      setIsSavingNote(true);
      await setDoc(doc(db, 'users', user.uid, 'homeNotes', 'main'), { 
        content: homeNote, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      setIsSavingNote(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [homeNote, user]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputTodo) return;
    await addDoc(collection(db, 'users', user.uid, 'familyTodos'), {
      title: inputTodo,
      category: activeTab === 'grocery' ? groceryCategory : null,
      completed: false,
      type: activeTab,
      createdAt: serverTimestamp()
    });
    setInputTodo('');
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'familyTodos', id), { completed: !completed });
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'familyTodos', id));
  };

  const clearCompleted = async () => {
    if (!user) return;
    const completedTodos = todos.filter(t => t.type === activeTab && t.completed);
    if (completedTodos.length === 0) return;
    
    if (!confirm(`Remove ${completedTodos.length} completed items?`)) return;

    const batch = writeBatch(db);
    completedTodos.forEach(t => {
      batch.delete(doc(db, 'users', user.uid, 'familyTodos', t.id));
    });
    await batch.commit();
    showToast("List cleared! ✨");
  };

  const getEventCountdown = (event: FamilyEvent) => {
    // If we have month/day directly
    if (event.month !== undefined && event.day !== undefined) {
      const eventDate = new Date(today.getFullYear(), event.month, event.day);
      if (eventDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        eventDate.setFullYear(today.getFullYear() + 1);
      }
      return differenceInDays(eventDate, new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    }
    
    // Fallback for old ISO date format
    const eventDate = new Date(event.date);
    const nextDate = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    if (nextDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      nextDate.setFullYear(today.getFullYear() + 1);
    }
    const diff = differenceInDays(nextDate, new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    return diff;
  };

  const sortedEvents = [...events].sort((a, b) => getEventCountdown(a) - getEventCountdown(b));

  const groceryGrouped = GROCERY_CATEGORIES.map(cat => ({
    ...cat,
    items: todos.filter(t => t.type === 'grocery' && t.category === cat.id)
      .sort((a, b) => Number(a.completed) - Number(b.completed))
  })).filter(g => g.items.length > 0);

  const householdTodos = todos.filter(t => t.type === 'todo')
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h1 className="text-4xl font-semibold text-primary-text mb-2">Family Corner</h1>
        <p className="text-secondary-text">Because your heart lives here, Prof. Samanta. 🏠</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[48fr_52fr] gap-8">
        {/* Birthdays & Events */}
        <div className="bg-white rounded-[24px] border border-border-card p-8 shadow-sm h-full flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Gift className="text-dusty-rose" /> Birthdays & Anniversaries
            </h3>
            <button 
              onClick={() => setIsEventModalOpen(true)}
              className="px-4 py-2 bg-brand-bg rounded-xl text-sage font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-sage/10 transition-colors"
            >
              <Plus size={16} /> Add Event
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {sortedEvents.map((event) => {
              const countdown = getEventCountdown(event);
              const isToday = countdown === 0;
              const isClose = countdown > 0 && countdown <= 7;
              
              let displayMonth = '';
              let displayDay = 0;
              
              if (event.month !== undefined) {
                displayMonth = MONTHS[event.month];
                displayDay = event.day;
              } else {
                const date = new Date(event.date);
                displayMonth = MONTHS[date.getMonth()];
                displayDay = date.getDate();
              }

              if (isToday) {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#7C9E87', '#A89BC2', '#E8D2A8', '#E6B7B7']
                });
              }

              return (
                <div 
                  key={event.id} 
                  className={`
                    relative group flex items-center gap-5 p-5 rounded-[22px] border transition-all hover:shadow-md
                    ${isToday ? 'bg-sage/5 border-sage/30 shadow-sm ring-2 ring-sage/10' : isClose ? 'bg-brand-bg/50 border-l-sage border-l-4' : 'bg-white border-divider'}
                  `}
                >
                  {isToday && (
                    <div className="absolute top-4 right-4 bg-sage text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest animate-bounce z-10">
                      Today! 🎉
                    </div>
                  )}
                  
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-sm ${isToday || isClose ? 'bg-sage text-white' : 'bg-brand-bg text-secondary-text'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{displayMonth.slice(0, 3)}</span>
                    <span className="text-2xl font-bold leading-none">{displayDay}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary-text text-lg">
                      {event.name} {event.type === 'Birthday' ? '🎂' : event.type === 'Anniversary' ? '💍' : '🌟'}
                    </h4>
                    <p className={`text-sm mt-0.5 ${isToday ? 'text-sage font-bold' : isClose ? 'text-sage font-medium' : 'text-secondary-text'}`}>
                      {isToday ? 'Happening today! Send your love. 🌸' : `in ${countdown} days`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteDoc(doc(db, 'users', user!.uid, 'familyEvents', event.id))} className="p-2 text-secondary-text hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-secondary-text space-y-4 bg-brand-bg/20 rounded-3xl border border-dashed border-divider">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-dusty-rose shadow-sm">
                   <Gift size={32} />
                 </div>
                 <p className="italic text-[15px]">No upcoming celebrations found. Add family birthdays and anniversaries to stay connected. 🌺</p>
              </div>
            )}
          </div>
        </div>

        {/* Home Notes */}
        <div className="bg-white rounded-[24px] border border-border-card p-8 shadow-sm flex flex-col h-full">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <StickyNote className="text-beige" /> Home Notes
              </h3>
              <div className="flex items-center gap-2">
                 {isSavingNote && <div className="w-1.5 h-1.5 rounded-full bg-sage animate-ping" />}
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                   {isSavingNote ? 'Saving...' : 'Changes synced'}
                 </span>
              </div>
           </div>
           
           <div className="flex-1 bg-beige/5 rounded-2xl p-8 min-h-[460px] border border-divider shadow-inner relative group">
              <textarea 
                className="w-full h-full bg-transparent border-none outline-none resize-none text-lg text-primary-text leading-relaxed font-serif placeholder:italic"
                placeholder="Write down menu ideas, vacation plans, or simple joys..."
                value={homeNote}
                onChange={(e) => setHomeNote(e.target.value)}
              />
              <div className="absolute bottom-6 right-8 text-dusty-rose/30 flex items-center gap-2 pointer-events-none group-focus-within:opacity-10 transition-opacity">
                 <Heart size={20} fill="currentColor" />
                 <span className="text-xs italic font-medium">Family First</span>
              </div>
           </div>
        </div>
      </div>

      {/* Lists Section Build 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-8">
         <div className="bg-white rounded-[32px] border border-border-card overflow-hidden shadow-sm flex flex-col">
            <div className="flex border-b border-divider bg-brand-bg/20">
               <button 
                 onClick={() => setActiveTab('todo')}
                 className={`flex-1 py-6 text-[13px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-b-2 ${activeTab === 'todo' ? 'border-sage text-sage bg-white' : 'border-transparent text-[#9CA3AF] hover:text-primary-text'}`}
               >
                 <ListTodo size={18} /> Home To-Do
               </button>
               <button 
                 onClick={() => setActiveTab('grocery')}
                 className={`flex-1 py-6 text-[13px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-b-2 ${activeTab === 'grocery' ? 'border-sage text-sage bg-white' : 'border-transparent text-[#9CA3AF] hover:text-primary-text'}`}
               >
                 <ShoppingCart size={18} /> Grocery List
               </button>
            </div>
            
            <div className="p-8 space-y-8">
               <div className="flex flex-col sm:flex-row gap-3">
                  <form onSubmit={handleAddTodo} className="relative flex-1">
                    <input 
                      type="text"
                      value={inputTodo}
                      onChange={(e) => setInputTodo(e.target.value)}
                      placeholder={activeTab === 'todo' ? "Add a household task..." : "What needs restocking?"}
                      className="w-full h-14 pl-12 pr-6 rounded-2xl bg-brand-bg border border-divider focus:border-sage focus:bg-white outline-none transition-all text-primary-text font-medium shadow-inner"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text">
                      {activeTab === 'todo' ? <ListTodo size={20} /> : <Plus size={20} />}
                    </div>
                  </form>
                  {activeTab === 'grocery' && (
                    <select 
                      value={groceryCategory}
                      onChange={(e) => setGroceryCategory(e.target.value)}
                      className="h-14 px-5 rounded-2xl bg-brand-bg border border-divider outline-none font-bold text-xs uppercase tracking-widest text-secondary-text appearance-none border-r-[16px] border-r-transparent"
                    >
                      {GROCERY_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  )}
                  <button 
                    onClick={handleAddTodo}
                    disabled={!inputTodo}
                    className="h-14 px-8 bg-sage text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-sage/10 disabled:opacity-50 transition-all hover:bg-sage/90"
                  >
                    Add
                  </button>
               </div>

               <div className="space-y-6">
                  {activeTab === 'todo' ? (
                    <div className="space-y-1">
                       {householdTodos.map(todo => (
                          <div key={todo.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-brand-bg transition-all group">
                             <button onClick={() => toggleTodo(todo.id, todo.completed)} className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${todo.completed ? 'bg-sage border-sage text-white' : 'border-divider group-hover:border-sage bg-white'}`}>
                                {todo.completed && <Check size={14} />}
                             </button>
                             <span className={`text-[17px] font-medium flex-1 ${todo.completed ? 'text-[#9CA3AF] line-through' : 'text-primary-text'}`}>{todo.title}</span>
                             <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-2 text-[#9CA3AF] hover:text-red-500 transition-all">
                                <Trash2 size={18} />
                             </button>
                          </div>
                       ))}
                       {householdTodos.length === 0 && (
                          <div className="text-center py-12 text-secondary-text italic text-[15px]">
                            Nothing on the list. Enjoy the peace! 🌿
                          </div>
                       )}
                    </div>
                  ) : (
                    <div className="space-y-8">
                       {groceryGrouped.map(group => (
                          <div key={group.id} className="space-y-3">
                             <h4 className={`text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-[6px] inline-block ${group.color}`}>
                                {group.label}
                             </h4>
                             <div className="space-y-1">
                                {group.items.map(item => (
                                   <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-brand-bg transition-all group">
                                      <button onClick={() => toggleTodo(item.id, item.completed)} className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${item.completed ? 'bg-sage border-sage text-white' : 'border-divider group-hover:border-sage bg-white'}`}>
                                         {item.completed && <Check size={14} />}
                                      </button>
                                      <span className={`text-[17px] font-medium flex-1 ${item.completed ? 'text-[#9CA3AF] line-through' : 'text-primary-text'}`}>{item.title}</span>
                                      <button onClick={() => deleteTodo(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-[#9CA3AF] hover:text-red-500 transition-all">
                                         <Trash2 size={18} />
                                      </button>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                       {groceryGrouped.length === 0 && (
                          <div className="text-center py-12 text-secondary-text italic text-[15px]">
                            The list is empty. Time to restock! 🛒
                          </div>
                       )}
                    </div>
                  )}
               </div>

               {todos.filter(t => t.type === activeTab && t.completed).length > 0 && (
                 <div className="flex justify-center pt-4">
                   <button 
                    onClick={clearCompleted}
                    className="flex items-center gap-2 px-6 py-2 rounded-full border border-divider text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                   >
                     <Trash size={14} /> Clear Completed
                   </button>
                 </div>
               )}
            </div>
         </div>

         {/* Calendar/Menu Planner (Already implemented placeholders) */}
         <div className="space-y-6">
            <div className="bg-[#8E9DAB] text-white rounded-[32px] p-10 shadow-lg shadow-blue-gray/20 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
               <h4 className="text-3xl font-bold mb-3">School Calendar</h4>
               <p className="text-blue-gray-light text-[17px] max-w-[240px] leading-relaxed">Stay updated with Ravi's school schedule and events.</p>
               <div className="mt-10 flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest">
                  View Calendar <ChevronRight size={18} />
               </div>
               <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Home size={220} />
               </div>
            </div>

            <div className="bg-[#D4A373] text-white rounded-[32px] p-10 shadow-lg shadow-beige/30 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
               <h4 className="text-3xl font-bold mb-3">Menu Planner</h4>
               <p className="text-beige-light text-[17px] max-w-[240px] leading-relaxed">What's cooking this week? Plan nutritious family meals.</p>
               <div className="mt-10 flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest">
                  Open Planner <ChevronRight size={18} />
               </div>
               <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <ShoppingCart size={220} />
               </div>
            </div>
         </div>
      </div>

      {/* Add Event Modal Build 7 */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-[#1A1A2E]/50 backdrop-blur-sm animate-in fade-in duration-200">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl relative"
             >
                <button 
                  onClick={() => setIsEventModalOpen(false)} 
                  className="absolute right-8 top-8 p-1.5 rounded-full hover:bg-brand-bg transition-colors text-[#9CA3AF]"
                >
                  <X size={24} />
                </button>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-primary-text">Add Celebration</h3>
                  <p className="text-sm text-secondary-text mt-1">Keep track of the moments that matter. 💖</p>
                </div>

                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    if (!user) return;
                    
                    const name = formData.get('name') as string;
                    const type = formData.get('type') as string;
                    const month = parseInt(formData.get('month') as string);
                    const day = parseInt(formData.get('day') as string);
                    const notes = formData.get('notes') as string;

                    await addDoc(collection(db, 'users', user.uid, 'familyEvents'), {
                      name,
                      type,
                      month,
                      day,
                      notes,
                      createdAt: serverTimestamp()
                    });
                    
                    setIsEventModalOpen(false);
                    showToast("Event added! 🎂");
                  }}
                  className="space-y-6"
                >
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Person's Name</label>
                      <input 
                        name="name" 
                        required 
                        autoFocus
                        placeholder="e.g. Ravi, Maa, Baba" 
                        className="w-full h-13 px-4 rounded-xl bg-brand-bg border border-divider focus:border-sage focus:bg-white outline-none transition-all font-medium"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Event Type</label>
                      <div className="flex p-1 bg-brand-bg rounded-xl border border-divider">
                        {['Birthday', 'Anniversary', 'Other'].map(t => (
                          <label key={t} className="flex-1 cursor-pointer">
                            <input type="radio" name="type" value={t} defaultChecked={t === 'Birthday'} className="hidden peer" />
                            <div className="h-10 flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-wider text-secondary-text peer-checked:bg-white peer-checked:text-sage peer-checked:shadow-sm transition-all">
                              {t === 'Birthday' ? '🎂 ' : t === 'Anniversary' ? '💍 ' : '🌟 '}{t}
                            </div>
                          </label>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Date (Month & Day)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <select name="month" className="h-13 px-4 rounded-xl bg-brand-bg border border-divider outline-none font-medium">
                          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                        <select name="day" className="h-13 px-4 rounded-xl bg-brand-bg border border-divider outline-none font-medium">
                          {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[10px] text-secondary-text italic mt-1">Year not needed for annual celebrations.</p>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Notes (Optional)</label>
                      <input 
                        name="notes" 
                        placeholder="Any reminders for this day?" 
                        className="w-full h-13 px-4 rounded-xl bg-brand-bg border border-divider focus:border-sage focus:bg-white outline-none transition-all font-medium"
                      />
                   </div>

                   <button type="submit" className="w-full h-14 bg-sage text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-sage/20 mt-4 transition-all hover:bg-sage/90 active:scale-[0.98]">
                    Save Event 🌸
                   </button>
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

    </div>
  );
}
