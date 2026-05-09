/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-[24px] border border-[#E7E7E2] shadow-sm p-12 max-w-md w-full flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 bg-[#E7EFE8] rounded-2xl flex items-center justify-center mb-6 text-sage">
          <Leaf size={32} />
        </div>
        
        <h1 className="text-[28px] font-semibold text-[#1A1A2E] leading-tight mb-2">My Command Center</h1>
        <p className="text-[16px] text-[#6B7280] mb-10">Your space. Your pace. 🌸</p>

        <button 
          onClick={login}
          className="w-full h-14 border border-[#E7E7E2] rounded-[14px] flex items-center justify-center gap-3 hover:bg-[#F0F0EC] transition-all group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="text-[16px] font-medium text-[#1A1A2E]">Continue with Google 🌸</span>
        </button>

        <p className="mt-12 text-[14px] text-[#6B7280] italic">Built with love, just for you 🌺</p>
      </motion.div>
    </div>
  );
}
