/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { TeachingHub } from './components/teaching/TeachingHub';
import { PhDTracker } from './components/phd/PhDTracker';
import { TaskManager } from './components/tasks/TaskManager';
import { FamilyCorner } from './components/family/FamilyCorner';
import { Settings } from './components/settings/Settings';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import LandingPage from './pages/LandingPage';
import { Page, Task } from './types';
import { ACADEMIC_QUOTES } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';

export default function App() {
  const { user, loading, profile } = useAuth();
  const location = useLocation();
  const [page, setPage] = useState<Page>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Quote logic
  const [quote] = useState(() => {
    const day = new Date().getUTCDate();
    return ACADEMIC_QUOTES[day % ACADEMIC_QUOTES.length];
  });

  // Real-time task syncing
  useEffect(() => {
    if (!user || !profile) return;

    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        taskList.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(taskList);
      setIsDataLoaded(true);
    });

    return () => unsubscribe();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sage/20 border-t-sage rounded-full animate-spin" />
          <p className="text-[#6B7280] font-medium">Getting things ready for you... 🌸</p>
        </div>
      </div>
    );
  }

  // Handle Auth Guards
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!profile) {
    return <Onboarding />;
  }

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', id);
      await updateDoc(taskRef, { 
        completed: !completed,
        completedAt: !completed ? new Date().toISOString() : null 
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Main App View
  return (
    <div className="min-h-screen bg-brand-bg flex scroll-smooth">
      <Sidebar currentPage={page} setPage={setPage} user={profile} />
      
      <main className="flex-1 ml-[260px] p-[32px_40px] overflow-y-auto min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Routes>
              {/* Redirect any root/login path to internal dashboard state when logged in */}
              <Route path="/" element={
                 page === 'dashboard' ? (
                  <Dashboard 
                    user={profile} 
                    tasks={tasks} 
                    toggleTask={toggleTask} 
                    quote={quote} 
                  />
                ) : page === 'teaching' ? (
                  <TeachingHub />
                ) : page === 'phd' ? (
                  <PhDTracker />
                ) : page === 'tasks' ? (
                  <TaskManager tasks={tasks} toggleTask={toggleTask} />
                ) : page === 'family' ? (
                  <FamilyCorner />
                ) : (
                  <Settings user={profile} />
                )
              } />
              <Route path="/login" element={<Navigate to="/" replace />} />
              {/* Fallback for other potential paths */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Note: In this architecture, 'page' state drives the content, 
                but we use Routes to ensure URL compatibility and redirects. */}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
