import React, { useEffect, useRef, useState } from 'react';
import { 
  Sun, 
  BookOpen, 
  GraduationCap, 
  CheckSquare, 
  Heart, 
  Cloud, 
  ChevronDown,
  Leaf
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon: Icon, iconBg, title, body, index }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={cardRef}
      className={`bg-white border border-[#E7E7E2] rounded-[20px] p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center mb-6`} style={{ backgroundColor: iconBg }}>
        <Icon className="w-7 h-7" style={{ color: title.includes('clarity') ? '#E8D2A8' : title.includes('classroom') || title.includes('less') ? '#7C9E87' : title.includes('doctorate') || title.includes('anywhere') ? '#A89BC2' : '#E6B7B7' }} />
      </div>
      <h3 className="text-xl font-semibold text-[#1A1A2E] mb-3">{title}</h3>
      <p className="text-[#6B7280] leading-relaxed">{body}</p>
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [petals, setPetals] = useState<any[]>([]);
  const letterRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);
  const [letterVisible, setLetterVisible] = useState(false);
  const [finalCtaVisible, setFinalCtaVisible] = useState(false);

  useEffect(() => {
    // Generate floating petals
    const newPetals = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 90 + 5}%`,
      size: `${Math.random() * 16 + 12}px`,
      duration: `${Math.random() * 8 + 8}s`,
      delay: `${Math.random() * 8}s`,
      color: Math.random() > 0.5 ? 'rgba(124, 158, 135, 0.08)' : 'rgba(230, 183, 183, 0.1)'
    }));
    setPetals(newPetals);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (entry.target === letterRef.current) setLetterVisible(true);
            if (entry.target === finalCtaRef.current) setFinalCtaVisible(true);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (letterRef.current) observer.observe(letterRef.current);
    if (finalCtaRef.current) observer.observe(finalCtaRef.current);

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Sun,
      iconBg: '#FDF6E7',
      title: "Start every day with clarity",
      body: "A warm greeting, today's priorities, and a quote that moves you — before you've had your chai."
    },
    {
      icon: BookOpen,
      iconBg: '#EEF4F0',
      title: "Your classroom, organised",
      body: "Subjects, schedules, lecture plans, and syllabus progress — for all four years of nursing students."
    },
    {
      icon: GraduationCap,
      iconBg: '#F0ECF9',
      title: "Every step toward your doctorate",
      body: "Track chapters, deadlines, writing streaks, and milestones. Your PhD journey, mapped and celebrated."
    },
    {
      icon: CheckSquare,
      iconBg: '#EEF4F0',
      title: "Do more by focusing on less",
      body: "Pin just 3 tasks each morning. End the day with a reflection. Never feel overwhelmed again."
    },
    {
      icon: Heart,
      iconBg: '#FCEEF0',
      title: "The people who matter most",
      body: "Birthdays, anniversaries, grocery lists, and home notes — your family life, gently organised."
    },
    {
      icon: Cloud,
      iconBg: '#F0ECF9',
      title: "On your phone, laptop, anywhere",
      body: "Powered by Firebase. Everything syncs instantly across all your devices. Always up to date."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] overflow-x-hidden">
      {/* Floating Petals Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {petals.map(petal => (
          <div 
            key={petal.id}
            className="petal"
            style={{
              left: petal.left,
              width: petal.size,
              height: petal.size,
              backgroundColor: petal.color,
              borderRadius: '50% 0 50% 50%',
              animationDuration: petal.duration,
              animationDelay: petal.delay
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 z-10">
        <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <span className="text-[12px] uppercase tracking-[0.12em] text-[#A89BC2] font-semibold mb-6 block">
            A Mother's Day Gift 🌸
          </span>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <h1 className="text-5xl md:text-7xl font-semibold text-[#1A1A2E] leading-[1.05] mb-8 max-w-[800px]">
            For the woman who does it all.
          </h1>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <p className="text-xl text-[#6B7280] leading-[1.7] max-w-[580px] mb-12">
            Prof. Samanta — teacher, researcher, mother, and force of nature. This space was built just for you.
          </p>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
          <button 
            onClick={() => navigate('/login')}
            className="bg-[#7C9E87] text-white rounded-[14px] px-9 py-4 text-base font-semibold transition-all duration-200 hover:bg-[#6B8E76] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(124,158,135,0.3)] shadow-sm"
          >
            Enter Your Space →
          </button>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bob opacity-40">
          <ChevronDown className="w-6 h-6 text-[#1A1A2E]" />
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-24 px-6 z-10 relative">
        <div className="max-w-[960px] mx-auto text-center mb-16">
          <span className="text-[13px] uppercase tracking-[0.1em] text-[#7C9E87] block mb-4">
            Everything she needs. All in one place.
          </span>
          <h2 className="text-[42px] font-semibold text-[#1A1A2E]">
            Your life, beautifully organised.
          </h2>
        </div>

        <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} index={i} />
          ))}
        </div>
      </section>

      {/* Personal Letter Section */}
      <section className="bg-white border-y border-[#E7E7E2] py-24 px-6 z-10 relative">
        <div 
          ref={letterRef}
          className={`max-w-[680px] mx-auto text-center reveal-on-scroll ${letterVisible ? 'is-visible' : ''}`}
        >
          <div className="flex justify-center gap-2 mb-8 opacity-20">
            <Leaf className="w-5 h-5 text-[#7C9E87]" />
            <Leaf className="w-5 h-5 text-[#E6B7B7] rotate-45" />
            <Leaf className="w-5 h-5 text-[#7C9E87] -rotate-45" />
          </div>
          <h2 className="text-4xl font-semibold text-[#1A1A2E] mb-12">To Ma, with love.</h2>
          <div className="text-lg text-[#6B7280] leading-[2.0] italic space-y-8">
            <p>
              You wake up before the sun, prepare lessons, guide students, 
              chase your PhD, and still make sure everyone at home is taken care of. 
              You do all of this quietly, without asking for recognition.
            </p>
            <p>
              This space was built for you — not to add more to your plate, 
              but to make the plate a little lighter.
            </p>
            <p>
              Every feature here was designed thinking of you specifically. 
              Your subjects, your research, your family, your goals.
            </p>
            <p>
              You are not just a lecturer. You are shaping the next generation 
              of nurses who will go on to save lives.
            </p>
            <p>
              Happy Mother's Day, Ma. <br />
              You deserve this and so much more. 🌺
            </p>
          </div>
          <div className="mt-12 text-[14px] text-[#A89BC2] font-medium">
            — Made with love, just for you 🌸
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 text-center z-10 relative">
        <div 
          ref={finalCtaRef}
          className={`max-w-[800px] mx-auto reveal-on-scroll ${finalCtaVisible ? 'is-visible' : ''}`}
        >
          <h2 className="text-5xl font-semibold text-[#1A1A2E] mb-6">Your space is ready, Prof. Samanta.</h2>
          <p className="text-lg text-[#6B7280] mb-12">Everything is set up and waiting for you.</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-[#7C9E87] text-white rounded-[14px] px-9 py-4 text-base font-semibold transition-all duration-200 hover:bg-[#6B8E76] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(124,158,135,0.3)] shadow-sm mb-6"
          >
            Enter Your Space →
          </button>
          <div className="text-[13px] text-[#9CA3AF]">
            Sign in with your Google account. Your data is private and secure. 🔒
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAFAF8] border-t border-[#E7E7E2] py-8 px-6 z-10 relative">
        <div className="max-w-[960px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[15px] text-[#6B7280] font-medium">
            <div className="w-8 h-8 rounded-full bg-[#EEF4F0] flex items-center justify-center">
              <Leaf className="w-4 h-4 text-[#7C9E87]" />
            </div>
            My Command Center
          </div>
          <div className="text-[14px] text-[#9CA3AF]">
            Made with 🌸 for Uma Samanta
          </div>
        </div>
      </footer>
    </div>
  );
}
