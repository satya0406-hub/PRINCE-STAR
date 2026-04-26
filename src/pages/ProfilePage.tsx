import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Award, MessageSquare, Trash2, Shield, Clock, ChevronRight, LogOut, Loader2, History, Key, Settings2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { handleFirestoreError } from '../lib/errorHandler';
import { BadgeModal } from '../components/BadgeModal';
import { NeuralEngineModal } from '../components/NeuralEngineModal';
import { AccessLogsModal } from '../components/AccessLogsModal';

export function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isNeuralModalOpen, setIsNeuralModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('custom_gemini_api_key') || '');
  const [showApiKeySuccess, setShowApiKeySuccess] = useState(false);

  const saveApiKey = () => {
    localStorage.setItem('custom_gemini_api_key', customApiKey);
    setShowApiKeySuccess(true);
    setTimeout(() => setShowApiKeySuccess(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const clearHistory = async () => {
    if (!user || clearing) return;
    if (!confirm('Are you sure you want to delete all conversations? This cannot be undone.')) return;
    
    setClearing(true);
    try {
      const q = query(collection(db, `users/${user.uid}/chats`));
      const snapshot = await getDocs(q).catch(e => {
        handleFirestoreError(e, 'list', `users/${user.uid}/chats`);
        return null;
      });
      if (snapshot) {
        await Promise.all(snapshot.docs.map(d => 
          deleteDoc(doc(db, `users/${user.uid}/chats`, d.id))
            .catch(e => handleFirestoreError(e, 'delete', `users/${user.uid}/chats/${d.id}`))
        ));
        alert('History cleared successfully.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  if (!user) return null;

  const badges = profile?.badges || ['Early Adopter'];
  const totalBadges = profile?.totalBadges || 0;

  return (
    <div className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12 text-center md:text-left">
        <div className="w-24 h-24 rounded-3xl bg-brand-blue flex items-center justify-center shadow-2xl shadow-blue-500/40 border-4 border-white/10 overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-white">{user.displayName?.[0] || 'U'}</span>
          )}
        </div>
        <div className="space-y-2 flex-grow">
          <h1 className="text-4xl font-bold font-serif">{user.displayName}</h1>
          <p className="text-gray-400 font-medium">{user.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Connection Active
            </span>
            <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {badges[badges.length - 1]}
            </span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
        {/* Achievements */}
        <div className="glass-card p-10 ring-1 ring-white/10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-blue/20 ring-1 ring-brand-blue/30">
              <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-2xl font-bold font-serif tracking-tight text-white">Neural Status</h3>
          </div>
          <div className="space-y-6">
            <div className="mb-6 p-6 bg-white/5 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                <span>Next Badge Progress</span>
                <span className="text-brand-blue">{Math.min((profile?.progress || 0) * 10, 100)}%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((profile?.progress || 0) * 10, 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-brand-blue rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-4 text-center">
                {10 - (profile?.progress || 0)} neurals until next level
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsBadgeModalOpen(true)}
                className="w-full p-6 bg-white/[0.03] rounded-3xl border border-white/10 hover:bg-white/[0.06] transition-all flex flex-col items-center gap-3 group"
              >
                <Award className="w-8 h-8 text-brand-blue group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Badges</span>
              </button>
              <button 
                onClick={() => {
                  setIsLogsModalOpen(true);
                  if (user) {
                    addDoc(collection(db, `users/${user.uid}/accessLogs`), {
                      action: 'Security Log Audit Initiated',
                      type: 'neural',
                      source: 'Vault Protocol',
                      timestamp: serverTimestamp()
                    }).catch(() => {});
                  }
                }}
                className="w-full p-6 bg-white/[0.03] rounded-3xl border border-white/10 hover:bg-white/[0.06] transition-all flex flex-col items-center gap-3 group"
              >
                <History className="w-8 h-8 text-brand-blue group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interaction Metrics */}
        <div className="space-y-8">
          <div className="glass-card p-10 ring-1 ring-white/10">
             <div className="flex items-center gap-4 mb-10">
              <MessageSquare className="text-brand-blue w-8 h-8" />
              <h3 className="text-2xl font-bold font-serif tracking-tight text-white">Interaction Log</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5 text-center shadow-inner">
                <p className="text-4xl font-serif font-bold text-white mb-2">{profile?.conversationsCount || 0}</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">Total Tasks</p>
              </div>
              <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5 text-center shadow-inner">
                <p className="text-4xl font-serif font-bold text-brand-blue mb-2">{totalBadges}</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">Badges Earned</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="col-span-2 mt-8 border-t border-white/10 pt-8">
                <div className="flex items-center gap-4 mb-6">
                  <Key className="text-brand-blue w-6 h-6" />
                  <h3 className="text-xl font-bold font-serif tracking-tight text-white">Neural Engine</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-widest font-medium">
                    If Neural Core is unresponsive (Quota Limit), enter your private Gemini API key below to bypass global constraints.
                  </p>
                  <div className="relative group">
                    <input 
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="ENTER GEMINI API KEY..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-xs tracking-widest font-black focus:outline-none focus:border-brand-blue/50 transition-all placeholder:text-gray-700 text-white"
                    />
                    <button 
                      onClick={saveApiKey}
                      className="absolute right-2 top-2 bottom-2 px-6 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue/90 transition-all shadow-lg shadow-blue-500/20"
                    >
                      Sync
                    </button>
                  </div>
                  <AnimatePresence>
                    {showApiKeySuccess && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-[10px] text-brand-blue font-black uppercase tracking-[0.2em] flex items-center gap-2"
                      >
                         Engine Synchronized Successfully
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button 
                onClick={() => setIsBadgeModalOpen(true)}
                className="flex items-center justify-center gap-3 py-5 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest border border-brand-blue/20 group"
              >
                <Award className="w-5 h-5 group-hover:scale-125 transition-transform" />
                Badges
              </button>
              <button 
                onClick={() => setIsLogsModalOpen(true)}
                className="flex items-center justify-center gap-3 py-5 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest border border-brand-blue/20 group"
              >
                <History className="w-5 h-5 group-hover:scale-125 transition-transform" />
                Logs
              </button>
            </div>
          </div>

          <div className="glass-card p-10 border-red-500/10 ring-1 ring-red-500/5">
            <h4 className="text-xl font-bold font-serif mb-6 text-red-400">Archival Management</h4>
            <p className="text-sm text-gray-500 mb-10 leading-relaxed font-medium">
              You can permanently purge all session history and neural fingerprints from our secure storage protocols. This action is irreversible.
            </p>
            <button 
              onClick={clearHistory}
              disabled={clearing}
              className="w-full flex items-center justify-center gap-4 py-5 px-8 bg-black/40 hover:bg-red-500/20 text-red-500 rounded-[2rem] transition-all font-black text-xs uppercase tracking-[0.3em] border border-red-500/10 group shadow-lg"
            >
              {clearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 group-hover:scale-125 transition-transform rotate-6" />}
              Purge All Archives
            </button>
          </div>
          <div className="glass-card p-10 ring-1 ring-white/10 mt-8">
            <div className="flex items-center justify-between gap-4 mb-10">
              <div className="flex items-center gap-4">
                <Shield className="text-brand-blue w-8 h-8" />
                <h3 className="text-2xl font-bold font-serif tracking-tight text-white">Neural Engine Settings</h3>
              </div>
              <button 
                onClick={() => setIsNeuralModalOpen(true)}
                className="px-6 py-2.5 bg-brand-blue/10 hover:bg-brand-blue text-brand-blue hover:text-white border border-brand-blue/20 rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
              >
                <Settings2 className="w-4 h-4" /> Configure
              </button>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/10">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Stored Gemini Key</label>
                  <div className="relative group">
                    <div className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-gray-500 font-mono text-sm overflow-hidden whitespace-nowrap">
                       {profile?.customGeminiKey ? "••••••••••••••••••••••••••••••••" : "No external engine configured"}
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {profile?.customGeminiKey && (
                        <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                          <Shield className="w-2 h-2" />
                          Encrypted
                        </div>
                      )}
                      <Key className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                <div className="mt-4 flex flex-col gap-3">
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic">
                    * Your custom engine allows for higher rate limits and premium model access within Prince Star 3.0.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NeuralEngineModal isOpen={isNeuralModalOpen} onClose={() => setIsNeuralModalOpen(false)} />
      <AccessLogsModal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} />
      <BadgeModal isOpen={isBadgeModalOpen} onClose={() => setIsBadgeModalOpen(false)} />
    </div>
  );
}
