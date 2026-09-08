import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Send,
  Phone,
  RotateCcw,
  Bot,
  User,
  Clock,
  Calendar,
  Stethoscope,
  FileText,
  Ambulance,
  FlaskConical,
  Pill,
  Building2,
  AlertTriangle,
  ChevronDown,
  X,
  MessageSquare,
  Globe,
  ExternalLink
} from 'lucide-react';

const SUGGESTED_QUESTIONS_EN = [
  { id: 'timings', label: '🏥 Hospital Timings', query: 'What are the hospital and OPD timings?' },
  { id: 'doctors', label: '👨‍⚕️ Doctors & Departments', query: 'Which doctors and departments are available?' },
  { id: 'appointment', label: '📅 How to Book an Appointment?', query: 'How can I book an OPD appointment?' },
  { id: 'registration', label: '🧾 Registration Process', query: 'What is the patient registration process?' },
  { id: 'emergency', label: '🚑 Emergency Services', query: 'Tell me about emergency and ambulance services.' },
  { id: 'lab', label: '🧪 Laboratory & Tests', query: 'What lab tests and diagnostic facilities are available?' },
  { id: 'prescription', label: '💊 Prescription Information', query: 'How can I access my prescription and medicines?' },
  { id: 'facilities', label: '🏨 Hospital Facilities', query: 'What are the in-patient facilities and beds?' },
  { id: 'contact', label: '📞 Contact Hospital', query: 'What is the hospital contact phone number and address?' },
];

const SUGGESTED_QUESTIONS_BN = [
  { id: 'timings', label: '🏥 হাসপাতালের সময়সূচী', query: 'হাসপাতাল ও ওপিডি খোলার সময়সূচী কী?' },
  { id: 'doctors', label: '👨‍⚕️ ডাক্তার ও বিভাগ', query: 'কোন কোন বিশেষজ্ঞ ডাক্তার ও বিভাগ রয়েছে?' },
  { id: 'appointment', label: '📅 অ্যাপয়েন্টমেন্ট বুকিং', query: 'কীভাবে ওপিডি অ্যাপয়েন্টমেন্ট বুক করব?' },
  { id: 'registration', label: '🧾 রেজিস্ট্রেশন প্রক্রিয়া', query: 'নতুন রোগী রেজিস্ট্রেশন করার নিয়ম কী?' },
  { id: 'emergency', label: '🚑 জরুরি পরিষেবা (24x7)', query: 'জরুরি ও অ্যাম্বুলেন্স পরিষেবা সম্পর্কে জানান।' },
  { id: 'lab', label: '🧪 ল্যাব ও টেস্ট', query: 'কী কী রক্ত পরীক্ষা ও ডায়াগনস্টিক টেস্ট হয়?' },
  { id: 'prescription', label: '💊 প্রেসক্রিপশন ও ওষুধ', query: 'প্রেসক্রিপশন কীভাবে পাব এবং ফার্মেসি তথ্য?' },
  { id: 'facilities', label: '🏨 হাসপাতালের সুবিধাসমূহ', query: 'হাসপাতালে বেড ও অন্যান্য কী কী সুবিধা আছে?' },
  { id: 'contact', label: '📞 হাসপাতাল যোগাযোগ', query: 'হাসপাতালের ফোন নম্বর ও ঠিকানা কী?' },
];

export const ArogyaChatbot = ({ isFloating = false, onClose, initialOpen = true }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [language, setLanguage] = useState('en'); // 'en' or 'bn'
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'arogya',
      text: 'Hello! I’m Arogya. How can I help you with Sanaka Hospital information?',
      textBn: 'নমস্কার! আমি আরোগ্য। সনকা হাসপাতাল সম্পর্কিত তথ্যে আপনাকে কীভাবে সাহায্য করতে পারি?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMedicalWarning: false,
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    // Detect language from text if Bengali script exists
    const isBengali = /[\u0980-\u09FF]/.test(query) || language === 'bn';
    const activeLang = isBengali ? 'bn' : 'en';

    const userMsg = {
      id: Date.now() + '-user',
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.arogyaChat(query, activeLang);
      const arogyaMsg = {
        id: Date.now() + '-arogya',
        sender: 'arogya',
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMedicalWarning: res.is_medical_warning,
        suggestedActions: res.suggested_actions,
        hospitalPhone: res.hospital_phone || '+91-9083284529',
      };
      setMessages((prev) => [...prev, arogyaMsg]);
    } catch (err) {
      // Fallback response if offline or backend error
      const fallbackMsg = {
        id: Date.now() + '-arogya-fallback',
        sender: 'arogya',
        text: isBengali
          ? '📞 আপনি সরাসরি সনকা হাসপাতালে যোগাযোগ করতে পারেন: +91-9083284529।'
          : '📞 You can contact Sanaka Hospital at +91-9083284529 (Malandighi, Durgapur, West Bengal - 713212).',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMedicalWarning: false,
        hospitalPhone: '+91-9083284529',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now() + '-welcome',
        sender: 'arogya',
        text: language === 'bn'
          ? 'নমস্কার! আমি আরোগ্য। সনকা হাসপাতাল সম্পর্কিত তথ্যে আপনাকে কীভাবে সাহায্য করতে পারি?'
          : 'Hello! I’m Arogya. How can I help you with Sanaka Hospital information?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMedicalWarning: false,
      },
    ]);
  };

  const suggestedQuestions = language === 'bn' ? SUGGESTED_QUESTIONS_BN : SUGGESTED_QUESTIONS_EN;

  // Floating Toggle Button when closed
  if (isFloating && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-emerald-300/40"
      >
        <span className="text-lg">🌿</span>
        <span className="font-bold text-sm">💬 Ask Arogya</span>
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
      </button>
    );
  }

  const containerClasses = isFloating
    ? 'fixed bottom-5 right-5 z-50 w-full max-w-[420px] max-h-[640px] h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300'
    : 'w-full bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden h-[620px]';

  return (
    <div className={containerClasses}>
      {/* 🌿 Chatbot Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-800 text-white p-4 shrink-0 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-xl shadow-inner shrink-0">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-tight flex items-center gap-1.5">
                <span>Arogya</span>
                <span className="text-[10px] font-semibold bg-emerald-400/30 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300/30">
                  AI Hospital Assistant
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-emerald-100 font-medium line-clamp-1">
              Sanaka Hospital Information & OPD FAQ Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            title="Switch Language / ভাষা পরিবর্তন করুন"
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-white/20"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-200" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close for Floating Mode */}
          {isFloating && (
            <button
              onClick={() => {
                setIsOpen(false);
                if (onClose) onClose();
              }}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hospital Hotline Quick Banner */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">Hospital Helpline:</span>
          <span className="font-mono font-bold">+91-9083284529</span>
        </div>
        <a
          href="tel:+919083284529"
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
        >
          <Phone className="w-3 h-3" />
          <span>Call Hospital</span>
        </a>
      </div>

      {/* Subheader Intro */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 text-[11px] text-slate-500 italic text-center">
        “Ask me about our hospital, OPD, doctors, appointments and facilities.”
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs shrink-0 mt-0.5">
                  🌿
                </div>
              )}

              <div className={`max-w-[85%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs font-medium'
                      : m.isMedicalWarning
                      ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {m.isMedicalWarning && (
                    <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px] mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Medical Disclaimer Notice</span>
                    </div>
                  )}

                  <p>{language === 'bn' && m.textBn ? m.textBn : m.text}</p>

                  {/* Clickable Call Action if relevant */}
                  {(m.hospitalPhone || m.isMedicalWarning) && !isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${m.hospitalPhone || '+919083284529'}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>📞 Call Hospital (+91-9083284529)</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {m.time}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 items-center text-xs text-slate-500 bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-xs w-fit shadow-xs">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0">
              🌿
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-emerald-800">Arogya is typing</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Horizontal Carousel */}
      <div className="p-2.5 bg-slate-100/90 border-t border-slate-200">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>{language === 'bn' ? 'প্রস্তাবিত সাধারণ প্রশ্নসমূহ:' : 'Suggested Hospital Questions:'}</span>
          <span className="text-[9px] text-slate-400 font-normal">Click to ask instantly</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {suggestedQuestions.map((q) => (
            <button
              key={q.id}
              onClick={() => handleSendMessage(q.query)}
              disabled={loading}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 hover:text-emerald-800 whitespace-nowrap transition shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Free Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={language === 'bn' ? 'আপনার প্রশ্ন লিখুন (যেমন: ওপিডি সময়সূচী কী?)...' : 'Type your question (e.g. How to book OPD appointment?)...'}
          disabled={loading}
          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
