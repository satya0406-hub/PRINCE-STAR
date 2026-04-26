import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Calendar, User, ArrowLeft, Loader2, Clock } from 'lucide-react';
import { formatDate } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { handleFirestoreError } from '../lib/errorHandler';

interface Post {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  author: string;
  date: any;
  category: string;
}

export function ArticleDetailPage() {
  const { category: paramCategory, id } = useParams();
  const location = useLocation();
  const { user, updateProfile } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      
      // Determine category from param or pathname
      let category = paramCategory;
      if (!category) {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        if (pathSegments.length >= 2) {
          category = pathSegments[0]; // e.g. "blog" from "/blog/123"
        }
      }

      if (!category) return;

      try {
        const collectionMap: Record<string, string> = {
          blog: 'blogs',
          stories: 'stories',
          news: 'news',
          laws: 'laws'
        };
        const collectionName = collectionMap[category.toLowerCase()] || category.toLowerCase();
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as Post);
        }
      } catch (err) {
        handleFirestoreError(err, 'get', `${category}/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id, paramCategory, location.pathname]);

  if (loading) {
    return (
      <div className="pt-40 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
        <span className="text-gray-400">Loading neural archive...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-40 text-center">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <Link to="/" className="text-brand-blue hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
      <Link to={`/${post.category.toLowerCase()}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-blue mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to {post.category}
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {post.category}
            </span>
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(post.date?.toDate?.() || post.date)}</span>
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> {post.author}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 5 min read</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif leading-tight text-white">{post.title}</h1>
          <p className="text-xl text-gray-400 italic leading-relaxed border-l-4 border-brand-blue pl-6 py-2">
            {post.description}
          </p>
        </div>

        <div className="prose prose-invert max-w-none prose-blue prose-p:text-gray-300 prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-white prose-a:text-brand-blue">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </motion.div>
    </div>
  );
}
