import { Mail, Phone, Clock, MessageSquare, Send, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/errorHandler';

import { SectionHeader } from '../components/SectionHeader';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        createdAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, 'create', 'contacts'));
      
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-12">
          <SectionHeader 
            whiteText="Get" 
            blueText="in Touch" 
            description="Have questions about our neural intelligence architecture? Our team is ready to assist you in navigating the future of AI."
          />

          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Mail className="text-brand-blue w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Email Neural Support</h4>
                <p className="text-gray-400">support@princestar.ai</p>
                <span className="text-[10px] text-brand-blue font-bold uppercase tracking-widest mt-2 block">Available 24/7</span>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock className="text-gray-400 w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Response Latency</h4>
                <p className="text-gray-400">Typing in under 2 hours</p>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 block">Standard Average</span>
              </div>
            </div>
          </div>
        </div>

        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-10 space-y-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Direct Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-brand-blue outline-none transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Neural Email</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-brand-blue outline-none transition-all" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subject Matrix</label>
             <input 
               type="text" 
               value={formData.subject}
               onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
               placeholder="Inquiry about..." 
               className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-brand-blue outline-none transition-all" 
             />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Message Payload</label>
             <textarea 
               required
               rows={4} 
               value={formData.message}
               onChange={(e) => setFormData({ ...formData, message: e.target.value })}
               placeholder="Describe your request..." 
               className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-brand-blue outline-none transition-all resize-none" 
             />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-3 py-5 text-lg group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Transmit Message
                <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </>
            )}
          </button>

          {success && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="p-4 bg-green-500/10 text-green-400 rounded-xl text-center text-sm border border-green-500/20 flex items-center justify-center gap-2"
            >
               <CheckCircle className="w-4 h-4" /> Message successfully transmitted to neural archives.
            </motion.div>
          )}

          {error && (
            <div className="text-red-400 text-xs text-center border border-red-500/20 bg-red-500/10 p-3 rounded-xl">
              {error}
            </div>
          )}
        </motion.form>
      </div>
    </div>
  );
}
