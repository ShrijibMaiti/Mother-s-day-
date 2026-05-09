import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  Clock, 
  Bell, 
  Plus, 
  MoreHorizontal, 
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  GraduationCap,
  Check,
  Filter,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { Subject, ScheduleEntry, Lecture, PhDMilestone } from '../../types';
import { format, isToday, addDays, startOfWeek, parseISO, isPast, differenceInDays } from 'date-fns';

const tabs = [
  { id: 'subjects', label: 'My Subjects', icon: BookOpen },
  { id: 'schedule', label: 'Class Schedule', icon: Calendar },
  { id: 'planner', label: 'Lecture Planner', icon: ClipboardList },
  { id: 'syllabus', label: 'Syllabus Tracker', icon: Clock },
  { id: 'reminders', label: 'Reminders', icon: Bell },
];

const YEAR_INFO: Record<string, { color: string; label: string }> = {
  '1st': { color: '#7C9E87', label: '1st Year' },
  '2nd': { color: '#A89BC2', label: '2nd Year' },
  '3rd': { color: '#E8D2A8', label: '3rd Year' },
  '4th': { color: '#E6B7B7', label: '4th Year' },
};

const STATUS_STYLING = {
  Planned: { bg: '#FEF9E7', text: '#B7860B', border: '#F9E4A0' },
  Ready: { bg: '#EAF4FB', text: '#2E86C1', border: '#AED6F1' },
  Done: { bg: '#EAFAF1', text: '#1E8449', border: '#A9DFBF' },
};

export function TeachingHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [phdDeadlines, setPhdDeadlines] = useState<PhDMilestone[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'subject' | 'schedule' | 'lecture' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Filtering & Sorting for Planner
  const [plannerFilterSubject, setPlannerFilterSubject] = useState('All');
  const [plannerFilterStatus, setPlannerFilterStatus] = useState('All');
  const [plannerSortOrder, setPlannerSortOrder] = useState<'asc' | 'desc'>('asc');

  // Real-time syncing
  useEffect(() => {
    if (!user) return;

    const subjectsUnsub = onSnapshot(query(collection(db, 'users', user.uid, 'subjects'), orderBy('createdAt', 'desc')), (snap) => {
      setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    });

    const scheduleUnsub = onSnapshot(collection(db, 'users', user.uid, 'schedule'), (snap) => {
      setSchedule(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleEntry)));
    });

    const lecturesUnsub = onSnapshot(query(collection(db, 'users', user.uid, 'lectures'), orderBy('date', 'asc')), (snap) => {
      setLectures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture)));
    });

    const phdDeadlinesUnsub = onSnapshot(query(collection(db, 'users', user.uid, 'phdDeadlines'), orderBy('date', 'asc')), (snap) => {
      setPhdDeadlines(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhDMilestone)));
    });

    return () => {
      subjectsUnsub();
      scheduleUnsub();
      lecturesUnsub();
      phdDeadlinesUnsub();
    };
  }, [user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const deleteSubject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm("Remove this subject and all its data?")) {
      await deleteDoc(doc(db, 'users', user.uid, 'subjects', id));
      showToast("Subject removed. 🌿");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-primary-text mb-2">Teaching Hub</h1>
          <p className="text-secondary-text">Manage your classes, students, and curriculum. 📚</p>
        </div>
        <button 
          onClick={() => {
            if (activeTab === 'subjects') setModalType('subject');
            else if (activeTab === 'schedule') setModalType('schedule');
            else if (activeTab === 'planner') setModalType('lecture');
            else setModalType('subject');
            setIsModalOpen(true);
          }}
          className="bg-sage text-white px-6 h-12 rounded-xl font-medium flex items-center gap-2 hover:bg-sage/90 hover:-translate-y-0.5 transition-all shadow-lg shadow-sage/20 shrink-0"
        >
          <Plus size={20} /> {
            activeTab === 'subjects' ? 'Add Subject' : 
            activeTab === 'schedule' ? 'Add Class' : 
            activeTab === 'planner' ? 'Add Lecture' : 'Add Subject'
          }
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-main overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap
                ${isActive ? 'text-sage' : 'text-secondary-text hover:text-primary-text'}
              `}
            >
              <Icon size={18} />
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeTabHub"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-sage" 
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'subjects' && (
            <motion.div key="subjects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => {
                const totalTopics = subject.topics?.length || 0;
                const completedTopics = subject.topics?.filter(t => t.completed).length || 0;
                const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
                const info = YEAR_INFO[subject.year] || YEAR_INFO['1st'];
                
                return (
                  <div key={subject.id} className="bg-white rounded-[20px] border border-[#E7E7E2] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center" 
                        style={{ backgroundColor: `${info.color}20` }}
                      >
                        <BookOpen className="w-6 h-6" style={{ color: info.color }} />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2 bg-brand-bg rounded-lg text-secondary-text hover:text-sage transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={(e) => deleteSubject(e, subject.id)}
                          className="p-2 bg-brand-bg rounded-lg text-secondary-text hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-primary-text mb-2 line-clamp-1">{subject.name}</h3>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-white mb-4" style={{ backgroundColor: info.color }}>
                      {info.label}
                    </div>
                    
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        <span>{totalTopics} topics</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-[#FAFAF8] rounded-full overflow-hidden border border-[#E7E7E2]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ backgroundColor: info.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {subjects.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white border border-[#E7E7E2] rounded-[24px]">
                  <p className="text-secondary-text italic text-lg">No subjects added yet. Start your semester. 🌿</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
               <WeeklyGrid schedule={schedule} subjects={subjects} onAdd={() => { setModalType('schedule'); setIsModalOpen(true); }} />
            </motion.div>
          )}

          {activeTab === 'planner' && (
             <motion.div key="planner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <LecturePlanner 
                  lectures={lectures} 
                  subjects={subjects} 
                  filterSubject={plannerFilterSubject}
                  setFilterSubject={setPlannerFilterSubject}
                  filterStatus={plannerFilterStatus}
                  setFilterStatus={setPlannerFilterStatus}
                  sortOrder={plannerSortOrder}
                  setSortOrder={setPlannerSortOrder}
                />
             </motion.div>
          )}

          {activeTab === 'syllabus' && (
            <motion.div key="syllabus" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              {subjects.map(subject => (
                <SyllabusTracker 
                  key={subject.id} 
                  subject={subject} 
                  onUpdate={async (newTopics) => {
                    if (!user) return;
                    await updateDoc(doc(db, 'users', user.uid, 'subjects', subject.id), {
                      topics: newTopics
                    });
                  }}
                />
              ))}
              {subjects.length === 0 && (
                <div className="py-20 text-center bg-white border border-[#E7E7E2] rounded-[24px]">
                  <p className="text-secondary-text italic text-lg">Add subjects to start tracking your syllabus. 🌿</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reminders' && (
            <motion.div key="reminders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-2xl mx-auto">
               <RemindersList lectures={lectures} phdDeadlines={phdDeadlines} subjects={subjects} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modals 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType} 
        subjects={subjects}
        user={user}
        showToast={showToast}
      />

      {/* Local Toast */}
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

// --- Sub-components ---

function WeeklyGrid({ schedule, subjects, onAdd }: { schedule: ScheduleEntry[], subjects: Subject[], onAdd: () => void }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
  const today = format(new Date(), 'EEE');

  return (
    <div className="bg-white rounded-[20px] border border-[#E7E7E2] overflow-hidden shadow-sm">
      <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-[#E7E7E2] bg-[#FAFAF8]">
        <div className="p-4 border-r border-[#E7E7E2] font-semibold text-center text-xs uppercase tracking-widest text-secondary-text">Time</div>
        {days.map(day => (
          <div 
            key={day} 
            className={`p-4 border-r border-[#E7E7E2] font-semibold text-center text-xs uppercase tracking-widest transition-colors ${day === today ? 'text-sage bg-[#F7FBF8]' : 'text-secondary-text'}`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="relative">
        {hours.map((hour) => {
          const timeStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
          return (
            <div key={hour} className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-[#E7E7E2] h-20">
               <div className="p-3 border-r border-[#E7E7E2] text-[12px] font-medium text-[#9CA3AF] text-right">{timeStr}</div>
               {days.map((day) => {
                 const entries = schedule.filter(s => s.day === day && parseInt(s.startTime.split(':')[0]) === hour);
                 return (
                   <div 
                    key={day} 
                    onClick={onAdd}
                    className={`p-1 border-r border-[#E7E7E2] transition-all relative group cursor-pointer ${day === today ? 'bg-[#F7FBF8]' : 'hover:bg-[#FAFAF8]'}`}
                   >
                     {entries.map(entry => {
                       const subj = subjects.find(s => s.id === entry.subjectId);
                       const color = subj ? YEAR_INFO[subj.year]?.color || '#7C9E87' : '#7C9E87';
                       return (
                         <div 
                           key={entry.id} 
                           className="absolute inset-1 rounded-lg p-2 shadow-sm overflow-hidden border-l-[3px] transition-all hover:scale-[1.02] z-10"
                           style={{ 
                             backgroundColor: `${color}15`, 
                             borderColor: color 
                           }}
                         >
                            <p className="font-semibold text-[#1A1A2E] text-[13px] truncate leading-tight">{subj?.name || 'Class'}</p>
                            <p className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-1">
                              <Clock size={10} /> {entry.startTime} - {entry.endTime}
                            </p>
                            <p className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {entry.room}
                            </p>
                         </div>
                       );
                     })}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="text-sage w-5 h-5" />
                     </div>
                   </div>
                 );
               })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LecturePlanner({ 
  lectures, 
  subjects, 
  filterSubject, setFilterSubject, 
  filterStatus, setFilterStatus, 
  sortOrder, setSortOrder 
}: any) {
  const filtered = lectures.filter((l: any) => {
    const sMatch = filterSubject === 'All' || l.subjectId === filterSubject;
    const stMatch = filterStatus === 'All' || l.status === filterStatus;
    return sMatch && stMatch;
  }).sort((a: any, b: any) => {
    const dA = new Date(a.date).getTime();
    const dB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dA - dB : dB - dA;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E7E7E2] p-2 flex flex-wrap items-center gap-4">
         <div className="flex items-center gap-2 px-3">
           <Filter size={16} className="text-[#9CA3AF]" />
           <select 
             value={filterSubject} 
             onChange={(e) => setFilterSubject(e.target.value)}
             className="bg-transparent border-none outline-none text-[13px] font-medium text-primary-text py-1"
           >
             <option value="All">All Subjects</option>
             {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
           </select>
         </div>
         <div className="h-6 w-[1px] bg-[#E7E7E2]" />
         <div className="flex gap-1">
           {['All', 'Planned', 'Ready', 'Done'].map(s => (
             <button 
               key={s} 
               onClick={() => setFilterStatus(s)}
               className={`px-4 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all ${filterStatus === s ? 'bg-sage text-white' : 'text-secondary-text hover:bg-brand-bg'}`}
             >
               {s}
             </button>
           ))}
         </div>
         <div className="ml-auto flex items-center gap-2 pr-3">
            <span className="text-[12px] font-medium text-secondary-text">Date Order:</span>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-sage font-bold text-[12px] flex items-center gap-1 hover:underline"
            >
              {sortOrder === 'asc' ? 'Nearest First' : 'Latest First'}
              <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
         </div>
      </div>

      <div className="bg-white rounded-[20px] border border-[#E7E7E2] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E7E7E2]">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Subject</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Topic</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Notes</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1ED]">
              {filtered.map((lecture: any) => {
                const subj = subjects.find((s: any) => s.id === lecture.subjectId);
                const styling = STATUS_STYLING[lecture.status as keyof typeof STATUS_STYLING];
                const info = subj ? YEAR_INFO[subj.year] : YEAR_INFO['1st'];
                
                return (
                  <tr key={lecture.id} className="hover:bg-[#FAFAF9]/50 transition-colors h-[56px] group">
                    <td className="px-6 py-4">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm"
                        style={{ backgroundColor: info?.color || '#7C9E87' }}
                      >
                        {subj?.name.slice(0, 15) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[16px] font-medium text-[#1A1A2E]">{lecture.topic}</td>
                    <td className="px-6 py-4 text-[14px] text-[#6B7280]">
                      {format(new Date(lecture.date), 'EEE, d MMM')}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                        style={{ 
                          backgroundColor: styling.bg, 
                          color: styling.text, 
                          borderColor: styling.border 
                        }}
                      >
                        {lecture.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#6B7280] max-w-[200px] truncate relative overflow-visible">
                       <span className="line-clamp-1">{lecture.notes || '—'}</span>
                       {lecture.notes && (
                         <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-primary-text text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 w-40">
                            {lecture.notes}
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 text-[#9CA3AF] hover:text-sage transition-colors"><Pencil size={16} /></button>
                         <button className="p-1.5 text-[#9CA3AF] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-secondary-text italic bg-white">
                    No lectures found. Select or add a lecture to begin. 🌿
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SyllabusTracker({ subject, onUpdate }: { subject: any; onUpdate: (topics: any[]) => void | Promise<void>; key?: any }) {
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const info = YEAR_INFO[subject.year] || YEAR_INFO['1st'];
  const total = subject.topics?.length || 0;
  const completed = subject.topics?.filter(t => t.completed).length || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const toggleTopic = (topicId: string) => {
    const updated = subject.topics.map(t => 
      t.id === topicId ? { ...t, completed: !t.completed } : t
    );
    onUpdate(updated);
  };

  const addTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const newTopic = {
      id: crypto.randomUUID(),
      title: newTopicTitle.trim(),
      completed: false
    };
    onUpdate([...(subject.topics || []), newTopic]);
    setNewTopicTitle('');
    setIsAdding(false);
  };

  const deleteTopic = (topicId: string) => {
    const updated = subject.topics.filter(t => t.id !== topicId);
    onUpdate(updated);
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#E7E7E2] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#E7E7E2] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-[#1A1A2E]">{subject.name}</h3>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm" style={{ backgroundColor: info.color }}>
               {info.label}
            </span>
          </div>
          <div className="flex items-center gap-4 w-full max-w-sm">
             <div className="flex-1 h-2.5 bg-[#FAFAF8] rounded-full overflow-hidden border border-[#E7E7E2]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full rounded-full transition-all duration-1000" 
                  style={{ backgroundColor: info.color }}
                />
             </div>
             <span className="text-sm font-bold text-[#1A1A2E] whitespace-nowrap bg-[#FAFAF8] px-3 py-1 rounded-lg border border-[#E7E7E2]">
               {progress}% complete
             </span>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-sage text-sm font-bold flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4"
          >
            <Plus size={16} /> Add Topic
          </button>
        )}
      </div>

      <div className="p-4 bg-[#FAFAF9]/30">
        <div className="space-y-1">
          {subject.topics?.map(topic => (
            <div key={topic.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group">
              <button 
                onClick={() => toggleTopic(topic.id)}
                className={`w-7 h-7 rounded-[8px] flex items-center justify-center transition-all ${topic.completed ? 'bg-sage text-white shadow-sm' : 'bg-white border-2 border-[#E7E7E2] hover:border-sage'}`}
              >
                 {topic.completed && <Check size={18} />}
              </button>
              <span className={`text-[16px] font-medium flex-1 transition-colors ${topic.completed ? 'text-[#9CA3AF] line-through' : 'text-[#1A1A2E]'}`}>
                {topic.title}
              </span>
              <button 
                onClick={() => deleteTopic(topic.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-[#9CA3AF] hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          {isAdding && (
            <form onSubmit={addTopic} className="flex items-center gap-3 p-3 animate-in fade-in slide-in-from-top-2">
               <div className="w-7 h-7 rounded-[8px] border-2 border-dashed border-sage flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-sage" />
               </div>
               <input 
                 autoFocus
                 type="text" 
                 value={newTopicTitle} 
                 onChange={e => setNewTopicTitle(e.target.value)}
                 className="flex-1 bg-white border-b-2 border-sage outline-none py-1 text-[16px] placeholder:text-gray-300"
                 placeholder="Enter topic name..."
               />
               <div className="flex gap-2">
                 <button type="submit" className="text-sage p-1.5 hover:bg-sage/10 rounded-lg"><Check size={20} /></button>
                 <button type="button" onClick={() => setIsAdding(false)} className="text-[#9CA3AF] p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
               </div>
            </form>
          )}

          {total === 0 && !isAdding && (
            <div className="py-12 text-center text-secondary-text italic text-sm">
              Your syllabus is clean for this subject. Click "Add Topic" to begin mapping your curriculum. 🌿
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RemindersList({ lectures, phdDeadlines, subjects }: { lectures: Lecture[], phdDeadlines: PhDMilestone[], subjects: Subject[] }) {
  const now = new Date();
  
  const reminders = [
    ...lectures.filter(l => l.status !== 'Done').map(l => ({
      id: l.id,
      title: `${subjects.find(s => s.id === l.subjectId)?.name || 'Lecture'}: ${l.topic}`,
      date: new Date(l.date),
      type: 'Lecture' as const,
    })),
    ...phdDeadlines.map(d => ({
      id: d.id,
      title: d.title,
      date: new Date(d.date),
      type: 'PhD' as const,
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (reminders.length === 0) {
    return (
      <div className="py-24 text-center bg-white border border-[#E7E7E2] rounded-[24px] shadow-sm">
         <p className="text-lg text-secondary-text italic">No upcoming reminders. You're on top of it! 🌿</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       {reminders.map((reminder) => {
         const daysLeft = differenceInDays(reminder.date, new Date(now.getFullYear(), now.getMonth(), now.getDate()));
         const isOverdue = daysLeft < 0;
         const isSoon = daysLeft >= 0 && daysLeft <= 3;
         
         const dateDisplay = isToday(reminder.date) ? 'Today' :
                           daysLeft === 1 ? 'Tomorrow' : 
                           daysLeft === -1 ? 'Yesterday' :
                           daysLeft > 0 ? `In ${daysLeft} days` : 
                           format(reminder.date, 'EEE, d MMM');

         return (
           <div key={`${reminder.type}-${reminder.id}`} className="bg-white rounded-[18px] border border-[#E7E7E2] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                 <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${reminder.type === 'Lecture' ? 'bg-[#EEF4F0] text-sage' : 'bg-[#F0ECF9] text-lavender'}`}>
                    {reminder.type === 'Lecture' ? <BookOpen size={20} /> : <GraduationCap size={20} />}
                 </div>
                 <div>
                    <h4 className="font-semibold text-primary-text mb-1">{reminder.title}</h4>
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${reminder.type === 'Lecture' ? 'bg-sage text-white' : 'bg-lavender text-white'}`}>
                          {reminder.type}
                       </span>
                       <span className="text-xs text-[#9CA3AF]">{format(reminder.date, 'dd MMM yyyy')}</span>
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest inline-block ${
                   isOverdue ? 'bg-red-50 text-red-600 border border-red-100' :
                   isSoon ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                   'bg-[#FAFAF9] text-secondary-text'
                 }`}>
                    {isOverdue ? 'Overdue' : isSoon ? 'Soon' : dateDisplay}
                 </div>
                 <p className="text-[13px] text-[#9CA3AF] mt-1.5 font-medium">{dateDisplay}</p>
              </div>
           </div>
         );
       })}
    </div>
  );
}

// --- Modals implementation ---

function Modals({ isOpen, onClose, type, subjects, user, showToast }: any) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('1st');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  
  // Schedule Fields
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState('Mon');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');

  // Lecture Fields
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('Planned');

  const reset = () => {
    setTitle(''); setYear('1st'); setTopics([]); setTopicInput('');
    setSubjectId(''); setDay('Mon'); setStartTime('08:00'); setEndTime('09:00'); setRoom(''); setNotes('');
    setTopic(''); setDate(format(new Date(), 'yyyy-MM-dd')); setStatus('Planned');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (type === 'subject') {
        const topicsFormatted = topics.map(t => ({ id: crypto.randomUUID(), title: t, completed: false }));
        await addDoc(collection(db, 'users', user.uid, 'subjects'), {
          name: title, year, topics: topicsFormatted, createdAt: serverTimestamp(), colorTag: YEAR_INFO[year].color
        });
        showToast("Subject added! 📚");
      } else if (type === 'schedule') {
        await addDoc(collection(db, 'users', user.uid, 'schedule'), {
          subjectId, day, startTime, endTime, room, notes
        });
        showToast("Class added to schedule! 🗓️");
      } else if (type === 'lecture') {
        await addDoc(collection(db, 'users', user.uid, 'lectures'), {
          subjectId, topic, date, status, notes, createdAt: serverTimestamp()
        });
        showToast("Lecture added! 📚");
      }
      onClose();
      reset();
    } catch (e: any) {
      console.error(e);
    }
  };

  const addTopicChip = () => {
    if (topicInput.trim()) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1A2E]/40 backdrop-blur-[4px] animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-[20px] p-8 max-w-[480px] w-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col gap-6"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-semibold text-primary-text">
            Add {type === 'subject' ? 'Subject' : type === 'schedule' ? 'Class' : 'Lecture'}
          </h3>
          <button onClick={() => { onClose(); reset(); }} className="text-[#9CA3AF] hover:text-primary-text transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {type === 'subject' && (
            <>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Subject Name</label>
                <input 
                  autoFocus required type="text"
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none transition-all placeholder:text-gray-300"
                  placeholder="e.g. Obstetrics & Gynecology"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Year</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1st', '2nd', '3rd', '4th'].map((y) => (
                    <button
                      key={y} type="button"
                      onClick={() => setYear(y)}
                      className={`h-11 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${year === y ? 'bg-primary-text text-white border-transparent' : 'bg-white text-secondary-text border-[#E7E7E2] hover:bg-[#FAFAF8]'}`}
                    >
                      {y} Year
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Initial Topics</label>
                <div className="flex gap-2">
                  <input 
                    type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopicChip())}
                    className="flex-1 h-11 px-4 rounded-xl border border-[#E7E7E2] focus:border-sage outline-none"
                    placeholder="Type topic..."
                  />
                  <button type="button" onClick={addTopicChip} className="w-11 h-11 bg-sage/10 text-sage rounded-xl flex items-center justify-center hover:bg-sage/20 transition-all">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {topics.map((t, i) => (
                    <div key={i} className="bg-[#F0F0EC] text-primary-text px-3 py-1.5 rounded-full text-sm flex items-center gap-2 group transition-all">
                      {t}
                      <button type="button" onClick={() => setTopics(topics.filter((_, idx) => idx !== i))} className="text-[#9CA3AF] hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {(type === 'schedule' || type === 'lecture') && (
            <>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Select Subject</label>
                <select 
                  required value={subjectId} onChange={e => setSubjectId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] bg-white outline-none focus:border-sage"
                >
                  <option value="">Choose a subject...</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              
              {type === 'schedule' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Day</label>
                      <select value={day} onChange={e => setDay(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] bg-white outline-none">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Room</label>
                      <input type="text" value={room} onChange={e => setRoom(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] outline-none" placeholder="e.g. Hall 4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Start Time</label>
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">End Time</label>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] outline-none" />
                    </div>
                  </div>
                </>
              )}

              {type === 'lecture' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Topic Name</label>
                    <input required type="text" value={topic} onChange={e => setTopic(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] outline-none" placeholder="e.g. Introduction to Anatomy" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-[#E7E7E2] bg-white outline-none">
                        <option value="Planned">Planned</option>
                        <option value="Ready">Ready</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Notes (Optional)</label>
                <textarea 
                  rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full p-4 rounded-xl border border-[#E7E7E2] outline-none resize-none text-sm"
                  placeholder="Any extra details..."
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button" onClick={() => { onClose(); reset(); }}
              className="flex-1 h-12 rounded-xl font-semibold text-secondary-text bg-[#FAFAF8] border border-[#E7E7E2] hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 h-12 bg-sage text-white rounded-xl font-semibold hover:bg-[#6B8E76] hover:-translate-y-0.5 transition-all shadow-lg"
            >
              Save {type === 'subject' ? 'Subject' : 'Details'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
