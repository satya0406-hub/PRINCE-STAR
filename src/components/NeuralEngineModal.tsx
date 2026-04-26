import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Shield, ChevronRight, Cpu, Loader2, Sparkles } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { handleFirestoreError } from '../lib/errorHandler';

interface NeuralEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NeuralEngineModal({ isOpen, onClose }: NeuralEngineModalProps) {
  const { user, profile } = useAuth();
  const [apiKey, setApiKey] = useState(profile?.customGeminiKey || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { customGeminiKey: apiKey });
      onClose();
    } catch (err) {
      handleFirestoreError(err, 'update', `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0b0f1a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center border border-brand-blue/20">
                  <Cpu className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white tracking-tight">Neural Core Configuration</h2>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Connect Your Gemini API Key</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Master Key Access</label>
                  {profile?.customGeminiKey && (
                     <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Connection Active</span>
                     </div>
                  )}
                </div>
                
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2">
                    <Key className="w-5 h-5 text-gray-600 group-focus-within:text-brand-blue transition-colors" />
                  </div>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-brand-blue transition-all text-white placeholder:text-gray-700 font-medium"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-4">
                    <Shield className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Your key is encrypted and stored securely in the Prince Star 3.0 vault. It will only be used for your specific neural dialogues.
                    </p>
                  </div>
                  
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] rounded-2xl border border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-brand-blue" />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Get Free Key from Google</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Action */}
              <button 
                onClick={handleSave}
                disabled={saving || !apiKey}
                className="w-full py-5 bg-brand-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    Initialize Connection
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
