import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Plus, 
  History, 
  Brain, 
  MessageSquare, 
  Trash2, 
  Cpu, 
  Loader2, 
  AlertCircle, 
  Home, 
  HelpCircle, 
  Paperclip, 
  Mic, 
  ArrowUp, 
  Key, 
  CheckCircle, 
  X, 
  Sparkles, 
  SquarePen, 
  PanelLeftClose, 
  Menu, 
  User, 
  Settings2,
  Share2,
  Pin,
  Archive,
  Edit3,
  MoreVertical,
  Award,
  LogOut
} from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';

import { handleFirestoreError } from '../lib/errorHandler';
import { BadgeModal } from '../components/BadgeModal';
import { NeuralEngineModal } from '../components/NeuralEngineModal';
import { AccessLogsModal } from '../components/AccessLogsModal';

export function ChatAssistantPage() {
  const { id: urlChatId } = useParams();
  const navigate = useNavigate();
  const { user, profile, login } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(urlChatId || null);
  const [chats, setChats] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isNeuralModalOpen, setIsNeuralModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, chatId: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [renamingChat, setRenamingChat] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'logout' | 'shutdown' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { updateProfile, logout } = useAuth();
  
  const handleLogout = async () => {
    if (showConfirm === 'logout') {
      await logout();
      navigate('/');
    } else if (showConfirm === 'shutdown') {
      await logout();
      setSessionEnded(true);
    }
    setShowConfirm(null);
  };

  // Progress timer for chatting (1 progress per minute)
  useEffect(() => {
    if (!user || !profile) return;
    
    const interval = setInterval(async () => {
      try {
        const points = 0.5;
        const currentProgress = (profile.progress || 0) + points;
        const userRef = doc(db, 'users', user.uid);
        
        let updateData: any = {
          progress: increment(points),
          lastActive: serverTimestamp()
        };

        if (currentProgress >= 10) {
          const badgesToEarn = Math.floor(currentProgress / 10);
          updateData.progress = currentProgress % 10;
          updateData.totalBadges = increment(badgesToEarn);
          
          for(let i=0; i<badgesToEarn; i++) {
             const badgeName = `Elite ${profile.totalBadges + i + 1}`;
             await addDoc(collection(db, `users/${user.uid}/badgeHistory`), {
                badgeName,
                earnedAt: serverTimestamp(),
                pointsAtTime: 10
             });
          }
        }

        // Log progress activity
        await addDoc(collection(db, `users/${user.uid}/progressLogs`), {
          points: points,
          source: 'Neural Dialogue',
          timestamp: serverTimestamp()
        });

        await updateDoc(userRef, updateData);
      } catch (err) {
        console.error("Chat progress update failed:", err);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user, profile]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
      setUserMenuOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    setError(null);
    const q = query(collection(db, `users/${user.uid}/chats`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, 'list', `users/${user.uid}/chats`);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !activeChat) return;
    setError(null);
    const q = query(collection(db, `users/${user.uid}/chats/${activeChat}/messages`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, 'list', `users/${user.uid}/chats/${activeChat}/messages`);
    });
  }, [user, activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (urlChatId) {
      setActiveChat(urlChatId);
    }
  }, [urlChatId]);
  
  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    navigate(`/chat/${chatId}`);
  };

  const createNewChat = () => {
    setActiveChat(null);
    setMessages([]);
    navigate('/chat', { replace: true });
    // Force sidebar close on mobile if it was open
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user || loading) return;

    let chatId = activeChat;
    if (!chatId) {
      const chatRef = await addDoc(collection(db, `users/${user.uid}/chats`), {
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        createdAt: serverTimestamp(),
        lastMessage: input
      }).catch(e => {
        handleFirestoreError(e, 'create', `users/${user.uid}/chats`);
        return null;
      });
      if (!chatRef) return;
      chatId = chatRef.id;
      setActiveChat(chatId);
      navigate(`/chat/${chatId}`);
    }

    const userInput = input;
    setInput('');
    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, `users/${user.uid}/chats/${chatId}/messages`), {
        text: userInput,
        role: 'user',
        createdAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, 'create', `users/${user.uid}/chats/${chatId}/messages`));

      const customKey = profile?.customGeminiKey || localStorage.getItem('custom_gemini_api_key');
      const systemKey = process.env.GEMINI_API_KEY;
      const apiKey = customKey || systemKey;

      if (!apiKey) {
        throw new Error("No Neural Core key found. Please link your Gemini API key in settings.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ 
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: userInput }] }],
        config: {
          systemInstruction: "You are Prince Star AI assistant, an elite and highly knowledgeable neural engine. Provide comprehensive, deep, and detailed explanations for every query. If asked for live data like sports scores (IPL, etc.), news, or current events, use your tools to provide real-time accuracy. Maintain a professional, premium, and sophisticated tone. Your architecture is powered by Prince Star 3.0. Always verify facts and provide nuanced perspectives.",
          tools: [{ googleSearch: {} }]
        }
      });
      
      const aiText = response.text || "";
      
      if (!aiText) {
        throw new Error("AI Assistant failed to generate a response.");
      }
      
      await addDoc(collection(db, `users/${user.uid}/chats/${chatId}/messages`), {
        text: aiText,
        role: 'assistant',
        createdAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, 'create', `users/${user.uid}/chats/${chatId}/messages`));

      // Simple stats update
      await updateDoc(doc(db, 'users', user.uid), {
        conversationsCount: increment(1),
        lastActive: serverTimestamp()
      }).catch(e => handleFirestoreError(e, 'update', `users/${user.uid}`));

    } catch (err: any) {
      console.error("Gemini Error:", err);
      let errorMessage = '';
      
      try {
        // If error is a JSON string from API, parse it for a better message
        const parsed = JSON.parse(err.message || '{}');
        errorMessage = parsed.error?.message || err.message;
      } catch (e) {
        errorMessage = err.message || '';
      }
      
      // Handle Quota and Rate Limit errors specifically
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
        errorMessage = "Neural Core Busy: Gemini API quota exceeded (Limit reached). Please wait or use a different API key.";
      } else if (errorMessage.includes('404')) {
        errorMessage = "Neural Core Engine Configuration Error: Model not found or unavailable for this project (404). Switching to stable core...";
      } else if (errorMessage.includes('500') || errorMessage.includes('503')) {
        errorMessage = "Neural Core Engine Failure: Internal model error. Please retry.";
      }
      
      setError(errorMessage || 'An error occurred. Please verify your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };


  const deleteChat = async (chatId: string) => {
    if (!user || !chatId) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/chats`, chatId));
      if (activeChat === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
    } catch (err) {
       handleFirestoreError(err, 'delete', `users/${user.uid}/chats/${chatId}`);
    }
  };

  const togglePinChat = async (chatId: string, isPinned: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/chats`, chatId), { isPinned: !isPinned });
    } catch (err) {
      handleFirestoreError(err, 'update', `users/${user.uid}/chats/${chatId}`);
    }
  };

  const toggleArchiveChat = async (chatId: string, isArchived: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/chats`, chatId), { isArchived: !isArchived });
    } catch (err) {
      handleFirestoreError(err, 'update', `users/${user.uid}/chats/${chatId}`);
    }
  };

  const renameChat = async (chatId: string) => {
    if (!user || !newName.trim()) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/chats`, chatId), { title: newName });
      setRenamingChat(null);
      setNewName('');
    } catch (err) {
      handleFirestoreError(err, 'update', `users/${user.uid}/chats/${chatId}`);
    }
  };

  const shareChat = (chatId: string) => {
    const url = `${window.location.origin}/chat/${chatId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);
    });
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  if (sessionEnded) {
    return (
      <div className="h-screen bg-[#0b0f1a] flex flex-col items-center justify-center p-8 gap-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
            <X className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-white tracking-tight">Session Terminated</h1>
          <p className="text-gray-400">All neural connections have been safely severed. Protocol 3.0 session is now offline.</p>
          <div className="pt-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-brand-blue text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
            >
              <Home className="w-5 h-5" /> Return to Home Page
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#0b0f1a] flex flex-col items-center justify-center p-8 gap-8">
        <div className="w-20 h-20 bg-brand-blue/10 rounded-3xl flex items-center justify-center animate-bounce shadow-2xl shadow-blue-500/20 overflow-hidden border border-white/10">
          <img src={`${import.meta.env.BASE_URL}chatbot-logo.png`} alt="Prince Star" className="w-full h-full object-cover" />
        </div>
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-4xl font-serif font-bold text-white tracking-tight">Prince Star Intelligence</h1>
          <p className="text-gray-400">Please sign in to your command center to access neural computing resources.</p>
          <button onClick={login} className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-xl">
             Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  const pinnedChats = chats.filter(c => c.isPinned && !c.isArchived);
  const otherChats = chats.filter(c => !c.isPinned && !c.isArchived);

  return (
    <div className="h-screen bg-[#0b0f1a] flex overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Redesigned to match request */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative h-full bg-[#020617] border-r border-white/5 flex flex-col flex-shrink-0 z-50 w-[300px]"
          >
            {/* Sidebar Top Toggle and New Chat */}
            <div className="p-4 flex items-center justify-between">
               <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
               >
                  <PanelLeftClose className="w-5 h-5" />
               </button>
               <button 
                onClick={createNewChat}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                title="New Chat"
               >
                  <SquarePen className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-grow overflow-y-auto px-1 py-4 space-y-6 custom-scrollbar">
              {/* Pinned Chats */}
              {pinnedChats.length > 0 && (
                <div>
                   <div className="px-4 py-2 text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase flex items-center gap-2">
                     <Pin className="w-3 h-3 rotate-45" /> Pinned
                   </div>
                   <div className="space-y-1">
                      {pinnedChats.map(chat => (
                        <div
                          key={chat.id}
                          onClick={() => handleChatSelect(chat.id)}
                          onContextMenu={(e) => handleContextMenu(e, chat.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors group relative cursor-pointer",
                            activeChat === chat.id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                          )}
                        >
                          <MessageSquare className="w-4 h-4 opacity-50 flex-shrink-0 text-brand-blue" />
                          <span className="text-sm font-medium truncate flex-1">{chat.title}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, chat.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded">
                            <MoreVertical className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Chat History */}
              <div>
                <div className="px-4 py-2 text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase flex items-center gap-2">
                  <History className="w-3 h-3" /> Recent History
                </div>
                <div className="space-y-1">
                  {otherChats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      onContextMenu={(e) => handleContextMenu(e, chat.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors group relative cursor-pointer",
                        activeChat === chat.id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 opacity-50 flex-shrink-0" />
                      <span className="text-sm font-medium truncate flex-1">{chat.title}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, chat.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded">
                        <MoreVertical className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Bottom - User Account Info */}
            <div className="p-4 border-t border-white/5 bg-[#020617] relative">
               {/* Badge Progress UI */}
               <div className="mb-4 space-y-2">
                 <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                   <span>Badge Progress</span>
                   <span className="text-brand-blue">{Math.min((profile?.progress || 0) * 10, 100)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min((profile?.progress || 0) * 10, 100)}%` }}
                     className="h-full bg-gradient-to-r from-blue-600 to-brand-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                   />
                 </div>
               </div>

               <button 
                onClick={() => setIsNeuralModalOpen(true)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs mb-4 transition-all uppercase tracking-tighter",
                  profile?.customGeminiKey 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                    : "bg-brand-blue/10 text-brand-blue border border-brand-blue/20 hover:bg-brand-blue hover:text-white"
                )}
               >
                  <Cpu className="w-4 h-4" /> {profile?.customGeminiKey ? "Neural Core Linked" : "Connect Neural Engine"}
               </button>

               <div 
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
               >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 group-hover:border-brand-blue transition-all">
                     {user.photoURL ? (
                       <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-brand-blue/20 text-brand-blue">
                         <User className="w-5 h-5" />
                       </div>
                     )}
                  </div>
                  <div className="flex-grow min-w-0">
                     <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                     <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Settings2 className="w-4 h-4 text-gray-600 group-hover:text-white transition-all" />
               </div>

               {/* User Context Menu (Profile Dropdown) */}
               <AnimatePresence>
                 {userMenuOpen && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-4 mb-4 w-[280px] bg-[#0b0f1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                   >
                      <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Protocol 3.0 Control</p>
                      </div>
                      <div className="py-2">
                        <button 
                          onClick={() => { setIsBadgeModalOpen(true); setUserMenuOpen(false); }} 
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-brand-blue/10 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                        >
                          <Award className="w-5 h-5 text-brand-blue" /> Badge History
                        </button>
                        <button 
                          onClick={() => { setIsLogsModalOpen(true); setUserMenuOpen(false); }} 
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-brand-blue/10 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                        >
                          <History className="w-5 h-5 text-brand-blue" /> Access Logs
                        </button>
                        <div className="h-[1px] bg-white/5 my-2" />
                        <button 
                          onClick={() => { setUserMenuOpen(false); setShowConfirm('logout'); }} 
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-brand-blue/10 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                        >
                          <LogOut className="w-5 h-5 text-brand-blue" /> Log Out
                        </button>
                        <button 
                          onClick={() => { setUserMenuOpen(false); setShowConfirm('shutdown'); }} 
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-red-500/10 text-red-500 transition-all text-xs font-bold uppercase tracking-widest"
                        >
                          <X className="w-5 h-5" /> Shutdown Session
                        </button>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#161b2c] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border",
                showConfirm === 'shutdown' ? "bg-red-500/10 border-red-500/20" : "bg-blue-500/10 border-blue-500/20"
              )}>
                {showConfirm === 'shutdown' ? (
                  <X className="w-8 h-8 text-red-500" />
                ) : (
                  <LogOut className="w-8 h-8 text-brand-blue" />
                )}
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">
                {showConfirm === 'shutdown' ? 'Terminate Session?' : 'Confirm Logout?'}
              </h3>
              <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">
                {showConfirm === 'shutdown' 
                  ? "This will sever all neural connections and terminate your current session Protocol 3.0." 
                  : "Are you sure you want to log out and disconnect from your Prince Star account?"}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className={cn(
                    "flex-1 px-4 py-3 text-white rounded-xl text-sm font-bold transition-all shadow-xl",
                    showConfirm === 'shutdown' ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-brand-blue hover:bg-blue-600 shadow-blue-500/20"
                  )}
                >
                  {showConfirm === 'shutdown' ? 'Terminate' : 'Log Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-grow flex flex-col relative h-full">
        {/* Top Navbar */}
        <nav className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#0b0f1a]/50 backdrop-blur-md z-20">
           <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                   <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-lg overflow-hidden">
                    <img src={`${import.meta.env.BASE_URL}chatbot-logo.png`} alt="" className="w-full h-full object-cover" />
                 </div>
                 <span className="font-bold text-sm tracking-tight text-white uppercase opacity-80">Prince Star 3.0</span>
              </div>
           </div>

           <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/" className="p-2 text-gray-400 hover:text-white transition-all flex items-center gap-2" title="Home">
                 <Home className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline text-sm font-bold">Home</span>
              </Link>
              {profile?.badges?.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-white/5 h-10">
                   <button
                    onClick={() => setIsBadgeModalOpen(true)}
                    className="flex items-center gap-2 md:gap-3 group transition-all"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 border border-white/10 bg-[#0b0f1a] transition-transform group-hover:scale-105 active:scale-95">
                      <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="Badges" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <div className="flex items-center gap-1">
                        <span className="text-sm md:text-lg font-bold text-white tracking-tight">{(profile.totalBadges || 0) + (profile.badges?.length || 0)}</span>
                        <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm overflow-hidden opacity-60">
                          <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest text-slate-500 mt-0.5 md:mt-1 group-hover:text-blue-400 transition-colors hidden xs:block">View History</span>
                    </div>
                  </button>
                </div>
              )}
              <Link to="/admin" className="p-2 sm:px-3 sm:py-1.5 bg-brand-blue text-white rounded-lg hover:scale-105 transition-all" title="Admin">
                 <Settings2 className="w-5 h-5 sm:hidden" />
                 <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">ADMIN</span>
              </Link>
           </div>
        </nav>

        {/* Messaging Area - Non-page-scrollable, Message-only-scrollable */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full custom-scrollbar selection:bg-brand-blue selection:text-white"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ duration: 0.5 }}
                   className="relative group mb-8"
                >
                   <div className="w-24 h-24 bg-gradient-to-br from-brand-blue to-blue-900 rounded-3xl flex items-center justify-center z-10 relative overflow-hidden">
                      <img src={`${import.meta.env.BASE_URL}chatbot-logo.png`} alt="" className="w-full h-full object-cover" />
                   </div>
                   <div className="absolute inset-0 bg-brand-blue/30 blur-3xl animate-pulse -z-10 group-hover:bg-brand-blue/50 transition-all" />
                </motion.div>

                
                <h1 className="text-4xl sm:text-6xl font-serif font-black text-white tracking-tight mb-2">PRINCE STAR</h1>
                <p className="text-sm font-bold text-gray-500 tracking-[0.6em] uppercase">your personal ai assistant</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-10 space-y-12 px-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-3",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2 mb-1",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row text-brand-blue"
                  )}>
                     <div className={cn(
                        "p-1.5 rounded-lg border overflow-hidden",
                        msg.role === 'user' ? "bg-white/5 border-white/10" : "bg-brand-blue/10 border-brand-blue/20"
                     )}>
                        {msg.role === 'assistant' ? <img src={`${import.meta.env.BASE_URL}chatbot-logo.png`} className="w-4 h-4 object-contain" /> : <User className="w-4 h-4 text-gray-400" />}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        {msg.role === 'assistant' ? 'Neural Engine' : 'Commander'}
                     </span>
                  </div>
                  <div className={cn(
                    "max-w-[90%] p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === 'assistant' 
                      ? "bg-white/[0.03] border border-white/5 text-gray-200" 
                      : "bg-brand-blue text-white shadow-xl shadow-blue-500/10"
                  )}>
                     <div className="prose prose-invert prose-sm max-w-none select-text transition-all">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-brand-blue/60 text-xs font-bold animate-pulse">
                  <div className="flex gap-1">
                     {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                     ))}
                  </div>
                  PRINCE STAR is thinking...
                </div>
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {showShareSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-full text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 z-[200] whitespace-nowrap border border-white/10"
            >
              <CheckCircle className="w-4 h-4" />
              Link Copied Successfully
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Dock - Redesigned to match image 1 */}
        <div className="p-4 sm:p-6 pb-4">
           <div className="max-w-3xl mx-auto w-full">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
              
              <div className="relative group flex items-center">
                 {/* Left Icons Group */}
                 <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex items-center">
                    <button className="p-2 sm:p-2.5 text-gray-500 hover:text-white bg-white/5 rounded-xl transition-all" title="Attach Files">
                       <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                 </div>

                 <input
                   type="text"
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   placeholder="PRINCE STAR..."
                   className="w-full bg-[#161b29] border border-white/5 rounded-2xl py-4 sm:py-5 pl-12 sm:pl-16 pr-24 sm:pr-28 focus:outline-none focus:border-brand-blue transition-all shadow-2xl text-white placeholder:text-gray-600 font-medium text-sm sm:text-base"
                 />

                 {/* Right Icons Group */}
                 <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                    <button className="hidden sm:flex p-2.5 text-gray-500 hover:text-white transition-all" title="Voice Message">
                       <Mic className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className={cn(
                        "p-2 sm:p-2.5 rounded-xl transition-all",
                        input.trim() && !loading 
                          ? "bg-brand-blue text-white shadow-lg shadow-blue-500/20" 
                          : "bg-white/5 text-gray-700 cursor-not-allowed"
                      )}
                    >
                       <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                 </div>
              </div>

              <div className="mt-4 text-center">
                 <p className="text-[8px] sm:text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase">
                    Ai-powered intelligence • prince star 3.0
                 </p>
              </div>
           </div>
        </div>
      </div>
      
      {/* Rename Chat UI */}
      <AnimatePresence>
        {renamingChat && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#020617]/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Rename Session</h3>
              <input 
                autoFocus
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:border-brand-blue outline-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setRenamingChat(null)} className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition-all">Cancel</button>
                <button onClick={() => renameChat(renamingChat)} className="flex-1 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-[100] w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden backdrop-blur-xl"
          >
            <button onClick={() => shareChat(contextMenu.chatId)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-gray-300 hover:text-white transition-all text-sm font-medium">
              <Share2 className="w-4 h-4" /> Share Chat
            </button>
            <button 
              onClick={() => {
                const chat = chats.find(c => c.id === contextMenu.chatId);
                setNewName(chat?.title || '');
                setRenamingChat(contextMenu.chatId);
              }} 
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-gray-300 hover:text-white transition-all text-sm font-medium border-t border-white/5"
            >
              <Edit3 className="w-4 h-4" /> Rename
            </button>
            <button 
              onClick={() => togglePinChat(contextMenu.chatId, chats.find(c => c.id === contextMenu.chatId)?.isPinned)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-gray-300 hover:text-white transition-all text-sm font-medium"
            >
              <Pin className="w-4 h-4" /> {chats.find(c => c.id === contextMenu.chatId)?.isPinned ? 'Unpin' : 'Pin Chat'}
            </button>
            <button 
              onClick={() => toggleArchiveChat(contextMenu.chatId, chats.find(c => c.id === contextMenu.chatId)?.isArchived)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-gray-300 hover:text-white transition-all text-sm font-medium"
            >
              <Archive className="w-4 h-4" /> {chats.find(c => c.id === contextMenu.chatId)?.isArchived ? 'Restore' : 'Archive'}
            </button>
            <button 
              onClick={() => deleteChat(contextMenu.chatId)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-red-500 transition-all text-sm font-medium border-t border-white/5"
            >
              <Trash2 className="w-4 h-4" /> Delete Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <BadgeModal isOpen={isBadgeModalOpen} onClose={() => setIsBadgeModalOpen(false)} />
      <NeuralEngineModal isOpen={isNeuralModalOpen} onClose={() => setIsNeuralModalOpen(false)} />
      <AccessLogsModal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} />
    </div>
  );
}
