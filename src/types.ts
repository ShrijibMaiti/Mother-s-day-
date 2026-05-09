/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Page = 'dashboard' | 'teaching' | 'phd' | 'tasks' | 'family' | 'settings';

export interface Task {
  id: string;
  title: string;
  category: 'Teaching' | 'Research' | 'Admin' | 'Personal';
  priority: 'Urgent' | 'ThisWeek' | 'Someday';
  completed: boolean;
  pinned: boolean; 
  dueDate?: string | null;
  notes?: string;
  createdAt?: any;
  completedAt?: string | null;
  text?: string; // Legacy support
}

export interface UserProfile {
  name: string;
  role: string;
  city: string;
  college: string;
  avatar?: string;
  phdTitle?: string;
  university?: string;
  guideName?: string;
  targetDate?: string;
  quotePreference?: string;
  appName?: string;
}

export interface Quote {
  text: string;
  author: string;
}

export interface Subject {
  id: string;
  name: string;
  year: '1st' | '2nd' | '3rd' | '4th';
  colorTag: string;
  topics: { id: string; title: string; completed: boolean }[];
  createdAt?: any;
  progress?: number; // Calculated field
}

export interface ScheduleEntry {
  id: string;
  subjectId: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  startTime: string;
  endTime: string;
  room: string;
  notes?: string;
}

export interface Lecture {
  id: string;
  subjectId: string;
  topic: string;
  date: string;
  status: 'Planned' | 'Ready' | 'Done';
  notes?: string;
}

export interface PhDMilestone {
  id: string;
  title: string;
  date: string;
  notes?: string;
}

export interface FamilyEvent {
  id: string;
  name: string;
  type: 'Birthday' | 'Anniversary' | 'Other';
  date: string;
  notes?: string;
}

export interface FamilyTodo {
  id: string;
  title: string;
  type: 'todo' | 'grocery';
  category?: string;
  completed: boolean;
  createdAt?: any;
}
