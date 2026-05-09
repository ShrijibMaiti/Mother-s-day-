/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quote } from './types';

export const ACADEMIC_QUOTES: Quote[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Research is what I'm doing when I don't know what I'm doing.", author: "Wernher von Braun" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Success is the sum of small efforts, repeated day-in and day-out.", author: "Robert Collier" },
  { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" }
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Teaching: { bg: 'bg-tag-teaching-bg', text: 'text-tag-teaching-text' },
  Research: { bg: 'bg-tag-research-bg', text: 'text-tag-research-text' },
  Admin: { bg: 'bg-tag-admin-bg', text: 'text-tag-admin-text' },
  Personal: { bg: 'bg-tag-personal-bg', text: 'text-tag-personal-text' },
};

export const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  Urgent: { bg: 'bg-red-50', text: 'text-red-600' },
  ThisWeek: { bg: 'bg-amber-50', text: 'text-amber-600' },
  Someday: { bg: 'bg-blue-gray/10', text: 'text-blue-gray' },
};
