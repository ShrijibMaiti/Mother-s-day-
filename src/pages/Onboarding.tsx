/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft } from 'lucide-react';

export function Onboarding() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: 'Uma Samanta',
    city: 'Kolkata',
    college: 'Government Nursing College',
    phdTitle: '',
    university: '',
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const completeOnboarding = async () => {
    if (!user) return;
    
    const profile = {
      name: formData.name,
      role: "Senior Lecturer",
      college: formData.college,
      city: formData.city,
      phdTitle: formData.phdTitle,
      university: formData.university,
      quotePreference: "mixed",
      appName: "My Command Center",
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid, 'profile', 'default'), profile);
    // Reload page to trigger profile check in AuthContext
    window.location.reload();
  };

  const steps = [
    {
      id: 1,
      title: "What should we call you?",
      description: "We've pre-filled your name, but feel free to adjust it. 🌸",
      content: (
        <input 
          type="text" 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full h-14 px-6 rounded-[14px] border border-[#E7E7E2] focus:border-sage outline-none text-[17px]"
          placeholder="Your Name"
        />
      )
    },
    {
      id: 2,
      title: "Which city are you in?",
      description: "This helps us show you relevant info like the weather. ☁️",
      content: (
        <input 
          type="text" 
          value={formData.city} 
          onChange={(e) => setFormData({...formData, city: e.target.value})}
          className="w-full h-14 px-6 rounded-[14px] border border-[#E7E7E2] focus:border-sage outline-none text-[17px]"
          placeholder="City (e.g. Kolkata)"
        />
      )
    },
    {
      id: 3,
      title: "Tell us about your PhD",
      description: "You can skip this for now if you're not ready. 🎓",
      content: (
        <div className="space-y-4">
          <input 
            type="text" 
            value={formData.phdTitle} 
            onChange={(e) => setFormData({...formData, phdTitle: e.target.value})}
            className="w-full h-14 px-6 rounded-[14px] border border-[#E7E7E2] focus:border-sage outline-none text-[17px]"
            placeholder="Thesis Title"
          />
          <input 
            type="text" 
            value={formData.university} 
            onChange={(e) => setFormData({...formData, university: e.target.value})}
            className="w-full h-14 px-6 rounded-[14px] border border-[#E7E7E2] focus:border-sage outline-none text-[17px]"
            placeholder="University Name"
          />
        </div>
      )
    },
    {
      id: 4,
      title: "You're all set, Prof. Samanta! 🌸",
      description: "Welcome to your personal command center. We're so glad you're here.",
      content: (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-active-nav-bg rounded-full flex items-center justify-center text-sage mb-6">
             <ArrowRight size={32} />
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[24px] border border-[#E7E7E2] shadow-sm p-10 flex flex-col items-center text-center space-y-6"
          >
            <div>
              <h2 className="text-[24px] font-semibold text-[#1A1A2E] leading-tight mb-2">{currentStep.title}</h2>
              <p className="text-[15px] text-[#6B7280]">{currentStep.description}</p>
            </div>

            <div className="w-full pt-4">
              {currentStep.content}
            </div>

            <div className="w-full flex gap-3 pt-6">
              {step > 1 && (
                <button 
                  onClick={prevStep}
                  className="w-14 h-14 rounded-[14px] bg-[#F7F7F4] text-[#6B7280] flex items-center justify-center hover:bg-[#F0F0EC] transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {step < 4 ? (
                <button 
                  onClick={nextStep}
                  className="flex-1 h-14 bg-sage text-white rounded-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-sage/90 transition-all shadow-md shadow-sage/20"
                >
                  Next step <ArrowRight size={20} />
                </button>
              ) : (
                <button 
                  onClick={completeOnboarding}
                  className="flex-1 h-14 bg-sage text-white rounded-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-sage/90 transition-all shadow-md shadow-sage/20"
                >
                  Enter Command Center 🌸
                </button>
              )}
            </div>

            <div className="flex gap-2 justify-center pt-8">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className={`w-2 h-2 rounded-full transition-all ${step === i ? 'w-6 bg-sage' : 'bg-[#E7E7E2]'}`} />
               ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
