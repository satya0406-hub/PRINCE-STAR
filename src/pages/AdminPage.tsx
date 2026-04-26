import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Sparkles, Image as ImageIcon, Send, Loader2, CheckCircle, AlertCircle, Trash2, Edit, X, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, formatDate } from '../lib/utils';
import { handleFirestoreError } from '../lib/errorHandler';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';

interface ContentItem {
  id: string;
  title: string;
  category: string;
  date: any;
  author: string;
  content: string;
  description: string;
  image: string;
}

export function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('generate');
  
  // Generation State
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Blog');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Management State
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);

  const isAdmin = user?.email === 'satyamanikantareddysathi@gmail.com';
  const categories = ['Blog', 'Stories', 'News', 'Laws'];
  const collectionMap: Record<string, string> = {
    Blog: 'blogs',
    Stories: 'stories',
    News: 'news',
    Laws: 'laws'
  };

  useEffect(() => {
    if (activeTab === 'manage' && isAdmin) {
      fetchAllContent();
    }
  }, [activeTab]);

  const fetchAllContent = async () => {
    setManageLoading(true);
    try {
      const results: ContentItem[] = [];
      for (const cat of categories) {
        const colName = collectionMap[cat];
        const q = query(collection(db, colName), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
          results.push({ id: d.id, ...d.data(), category: cat } as ContentItem);
        });
      }
      setAllContent(results.sort((a, b) => {
        const dateA = a.date?.toDate?.()?.getTime() || a.date?.seconds || 0;
        const dateB = b.date?.toDate?.()?.getTime() || b.date?.seconds || 0;
        return dateB - dateA;
      }));
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setManageLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    
    setLoading(true);
    try {
      const colName = collectionMap[deletingItem.category] || deletingItem.category.toLowerCase();
      await deleteDoc(doc(db, colName, deletingItem.id));
      setAllContent(prev => prev.filter(i => i.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (err) {
      handleFirestoreError(err, 'delete', deletingItem.category);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    setLoading(true);
    try {
      const colName = collectionMap[editingItem.category] || editingItem.category.toLowerCase();
      const { id, ...data } = editingItem;
      await updateDoc(doc(db, colName, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setEditingItem(null);
      fetchAllContent();
    } catch (err) {
      handleFirestoreError(err, 'update', editingItem.category);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!topic.trim() || loading || !isAdmin) return;
    
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const systemInstructions = {
        Blog: "Generate a premium quality blog post about the topic. Output JSON: { title, description, content, author, image }",
        Stories: "Generate an engaging narrative story (replacing current affairs context with narrative fiction or longform journalism). Output JSON: { title, description, content, author, image }",
        News: "Search or simulate real-world info based on the headline: topic. Expand into a professional news report. Output JSON: { title, description, content, author, image }",
        Laws: "Explain a specific Indian Law or IPC Section related to: topic. Include section number, explanation, and examples. Output JSON: { title, description, content, author, image } (where title is 'IPC Section X - Name')"
      };

      const customKey = profile?.customGeminiKey || localStorage.getItem('custom_gemini_api_key');
      const systemKey = process.env.GEMINI_API_KEY;
      const apiKey = customKey || systemKey;

      if (!apiKey) {
        throw new Error("Neural core ignition failed: Gemini API key is missing. Please configure it in settings.");
      }

      const prompt = `${systemInstructions[category as keyof typeof systemInstructions]}. Topic: ${topic}. Provide a deep, thorough, and highly accurate analysis. Use Google Search grounding to ensure real-time accuracy for news, sports, and current affairs. Format output as RAW JSON matching this schema: { title, description, content, author, image }. Do not include markdown code block wrappers.`;
      
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      const dataText = result.text.trim();
      
      let generatedContent;
      try {
        const jsonStr = dataText.replace(/```json\n?/, '').replace(/\n?```/, '');
        generatedContent = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error("AI failed to return valid JSON. Response was: " + dataText);
      }

      const colName = collectionMap[category];
      
      const finalDoc = {
        title: generatedContent.title || topic,
        description: generatedContent.description || '',
        content: generatedContent.content || '',
        author: generatedContent.author || 'Prince Star AI',
        image: imageUrl || generatedContent.image || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
        category: category,
        date: serverTimestamp()
      };

      await addDoc(collection(db, colName), finalDoc).catch(e => handleFirestoreError(e, 'create', colName));

      setSuccess(true);
      setTopic('');
      setImageUrl('');
    } catch (err: any) {
      let errorMessage = err.message || '';
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
        errorMessage = "Neural Core Busy: Gemini API quota exceeded. Please wait or check your API key limits.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="pt-40 pb-24 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Unauthorized Access</h1>
        <p className="text-gray-400">This area is reserved for the platform administrator.</p>
        <Link to="/" className="inline-block mt-8 text-brand-blue hover:underline">Return to safety</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-4 max-w-6xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold font-serif tracking-tight">Neural Control</h1>
          <p className="text-gray-400">Command & control the platform's content generation and existing archives.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('generate')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
              activeTab === 'generate' ? "bg-brand-blue text-white shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            <Sparkles className="w-4 h-4" /> Generate
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
              activeTab === 'manage' ? "bg-brand-blue text-white shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            <LayoutGrid className="w-4 h-4" /> Manage Content
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'generate' ? (
          <motion.div 
            key="generate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-10 space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Target Headline / Topic</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. The future of Quantum Computing"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-brand-blue outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg border transition-all",
                        category === cat 
                          ? "bg-brand-blue border-brand-blue text-white shadow-lg shadow-blue-500/20" 
                          : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/10"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Image URL (Optional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-brand-blue outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handlePublish}
                disabled={!topic || loading}
                className="w-full btn-primary py-5 text-lg flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Neural Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate & Publish
                  </>
                )}
              </button>
            </div>

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5" />
                Neural archive updated successfully.
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="manage"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {manageLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Scanning Neural Pipelines...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {allContent.map((item) => (
                  <div key={item.id} className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">{formatDate(item.date)}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-gray-400 font-medium">By {item.author}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="p-3 bg-white/5 hover:bg-brand-blue/20 text-gray-400 hover:text-brand-blue rounded-xl transition-all border border-white/5"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setDeletingItem(item)}
                        className="p-3 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#161b2c] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete Content?</h3>
              <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">
                Are you sure you want to delete <span className="text-white font-bold">"{deletingItem.title}"</span>? This action is permanent.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#161b2c] border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-serif">Modify Neural Data</h3>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Title</label>
                  <input 
                    type="text" 
                    value={editingItem.title}
                    onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-brand-blue outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Author</label>
                  <input 
                    type="text" 
                    value={editingItem.author}
                    onChange={e => setEditingItem({...editingItem, author: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-brand-blue outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Image URL</label>
                  <input 
                    type="text" 
                    value={editingItem.image}
                    onChange={e => setEditingItem({...editingItem, image: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-brand-blue outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    rows={3}
                    value={editingItem.description}
                    onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-brand-blue outline-none resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Content (Markdown)</label>
                  <textarea 
                    rows={10}
                    value={editingItem.content}
                    onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-brand-blue outline-none resize-none font-mono text-sm"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleUpdate}
                    disabled={loading}
                    className="w-full bg-brand-blue hover:bg-blue-600 disabled:opacity-50 py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Overwrite Neural Archive
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

