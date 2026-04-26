import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Award, X, Clock, ChevronRight, History, Loader2, Sparkles } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface BadgeRecord {
  id: string;
  badgeName: string;
  earnedAt: any;
  pointsAtTime: number;
}

interface ProgressLog {
  id: string;
  points: number;
  source: string;
  timestamp: any;
}

export function BadgeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeRecord | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchBadges();
    }
  }, [isOpen, user]);

  const fetchBadges = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, `users/${user.uid}/badgeHistory`), orderBy('earnedAt', 'desc'));
      const snap = await getDocs(q);
      setBadges(snap.docs.map(d => ({ id: d.id, ...d.data() } as BadgeRecord)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (badge: BadgeRecord) => {
    if (!user) return;
    setSelectedBadge(badge);
    setLoadingLogs(true);
    try {
      // For simplicity, we just show all logs or filter by time if we had logic for it.
      // Here we show latest progress logs.
      const q = query(collection(db, `users/${user.uid}/progressLogs`), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setProgressLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgressLog)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Solid Dark Backdrop - ensuring total separation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#020617] backdrop-blur-2xl cursor-pointer"
          />
          
          {/* Standard Sized Close Button closer to modal */}
          <button 
            onClick={onClose} 
            className="fixed top-12 right-12 md:top-16 md:right-16 z-[10001] p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-2xl border-2 border-[#020617] group active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="bg-[#020617] border border-white/10 w-[95%] max-w-3xl h-[85vh] overflow-hidden flex flex-col shadow-[0_0_120px_rgba(0,0,0,1)] rounded-[2.5rem] relative z-[10000]"
          >
            {/* Modal Header - Compact */}
            <div className="p-6 md:p-8 border-b border-white/10 bg-[#0a0f1e] flex items-center justify-center gap-6">
              <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center border border-white/20 shadow-inner overflow-hidden">
                <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold font-serif tracking-tight">
                  <span className="text-white">Badge</span>
                  <span className="text-brand-blue ml-2">History</span>
                </h2>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.4em] opacity-80 italic">Verified Record Store</p>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 bg-[#020617] custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Synchronizing...</p>
                </div>
              ) : badges.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0f1e]/50 rounded-[2rem] border-2 border-dashed border-white/5 p-8">
                  <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-6 opacity-30" />
                  <h3 className="text-lg font-bold text-white mb-2">No Records Found</h3>
                  <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto">Engage with assistant to earn neural status.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {badges.map((badge) => (
                    <div key={badge.id} className="space-y-4">
                       <button
                        onClick={() => fetchLogs(badge)}
                        className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 group ${selectedBadge?.id === badge.id ? 'bg-[#1e293b] border-brand-blue/50 ring-2 ring-brand-blue/10' : 'bg-[#0f172a] border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-inner overflow-hidden ${selectedBadge?.id === badge.id ? 'bg-brand-blue text-white' : 'bg-[#1e293b]'}`}>
                             <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-bold text-white tracking-tight font-serif">{badge.badgeName}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                               <Clock className="w-3 h-3 opacity-50" />
                               {formatDate(badge.earnedAt?.toDate?.() || badge.earnedAt)}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${selectedBadge?.id === badge.id ? 'rotate-90 text-brand-blue' : 'text-gray-600'}`} />
                      </button>

                      <AnimatePresence>
                        {selectedBadge?.id === badge.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#0f172a] rounded-[1.5rem] p-6 border border-white/10 space-y-4 mx-2 relative overflow-hidden"
                          >
                            <div className="flex items-center gap-2 mb-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shadow-[0_0_8px_rgba(59,130,246,1)]" />
                               <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Activity Trace</span>
                            </div>
                            {loadingLogs ? (
                              <div className="flex items-center gap-3 py-6 text-[10px] text-gray-500 font-bold tracking-widest justify-center italic">
                                <Loader2 className="w-3 h-3 animate-spin text-brand-blue" /> Pulling logs...
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {progressLogs.slice(0, 5).map(log => (
                                  <div key={log.id} className="flex items-center justify-between p-4 bg-[#1e293b]/50 rounded-xl border border-white/5 text-xs">
                                     <div className="flex flex-col gap-0.5 text-left">
                                        <span className="text-white font-bold">{log.source}</span>
                                        <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{formatDate(log.timestamp?.toDate?.() || log.timestamp)}</span>
                                     </div>
                                     <div className="bg-brand-blue/10 px-3 py-1.5 rounded-lg border border-brand-blue/20">
                                        <span className="text-brand-blue font-black text-sm">+{log.points}</span>
                                     </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-[#020617] border-t border-white/10 text-center">
               <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.4em]">Protocol Spark • Neural Static</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
