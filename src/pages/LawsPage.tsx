import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { Search, Loader2, Scale, Info } from 'lucide-react';
import { motion } from 'motion/react';

import { handleFirestoreError } from '../lib/errorHandler';
import { SectionHeader } from '../components/SectionHeader';

interface Law {
  id: string;
  section: string;
  title: string;
  description: string;
  example: string;
}

export function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLaws() {
      try {
        const snapshot = await getDocs(query(collection(db, 'laws'), orderBy('section', 'asc')));
        setLaws(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Law)));
      } catch (err) {
        handleFirestoreError(err, 'list', 'laws');
      } finally {
        setLoading(false);
      }
    }
    fetchLaws();
  }, []);

  const filteredLaws = laws.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.section.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-32 pb-24 px-4 max-w-5xl mx-auto">
      <SectionHeader 
        whiteText="Indian Laws" 
        blueText="& IPC Sections" 
        description="Digital repository of Indian legal sections with AI-powered simplified explanations and real-life examples."
        align="center"
        className="mb-16"
      />
      
      <div className="text-center space-y-6 mb-16">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by section or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLaws.map((law, i) => (
            <motion.div
              key={law.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-8 group border-l-4 border-l-blue-600"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <span className="text-blue-400 font-bold text-sm uppercase tracking-widest">Section {law.section}</span>
                  <h3 className="text-2xl font-bold font-serif text-white">{law.title}</h3>
                </div>
                <Scale className="text-white/10 w-12 h-12" />
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{law.description}</p>
              
              <div className="flex items-start gap-3 text-sm text-slate-400 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-300 block mb-1">Example:</span>
                  {law.example}
                </div>
              </div>
            </motion.div>
          ))}
          {!loading && filteredLaws.length === 0 && (
            <div className="text-center py-24 text-slate-500 italic">No laws matched your search criteria.</div>
          )}
        </div>
      )}
    </div>
  );
}
