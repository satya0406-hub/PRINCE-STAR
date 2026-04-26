import { motion } from 'motion/react';
import { Rocket, Brain, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export function LandingPage() {
  return (
    <div className="relative pt-20">
      <div className="glow-bg" />
      
      {/* Hero Section */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-10 overflow-hidden relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-300 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            v2.0: Now with Gemini Pro support
          </div>
          
          <h1 className="text-4xl sm:text-7xl font-serif font-bold leading-tight mb-6 text-white uppercase italic">
            Think <span className="text-blue-500">Bigger</span>.<br/>
            Chat <span className="text-blue-500">Smarter</span>.
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-lg leading-relaxed mb-10 px-4">
            Empower your workflow with the most advanced AI assistant. Reimagined for professionals who demand precision, speed, and creative intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/chat" className="bg-white text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-white/5">
              Launch Assistant
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/blog" className="btn-secondary">
              Explore Blog
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats/Engineered section */}
      <section className="py-24 px-10 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[
              { 
                icon: Shield, 
                title: "Lightning Fast", 
                desc: "Proprietary inference engines ensure your answers arrive in milliseconds, not seconds.",
                color: "text-blue-400",
                bg: "bg-blue-500/10"
              },
              { 
                icon: Sparkles, 
                title: "Indian Law Expert", 
                desc: "Integrated IPC and legal database with AI-driven simplification for complex legal queries.",
                color: "text-indigo-400",
                bg: "bg-indigo-500/10"
              },
              { 
                icon: Brain, 
                title: "Smart Content", 
                desc: "Auto-fetching real-time news and generating deep-dive stories using Google Gemini API.",
                color: "text-purple-400",
                bg: "bg-purple-500/10"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 text-left"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", feature.bg, feature.color)}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24 px-4 text-center">
        <div className="glass-card max-w-5xl mx-auto py-20 px-8 relative overflow-hidden bg-gradient-to-br from-brand-blue/10 to-transparent">
          <div className="relative z-10 space-y-8">
            <h2 className="text-5xl font-bold">Ready to start?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users leveraging Prince Star to build the next generation of digital excellence.
            </p>
            <Link 
              to="/chat" 
              className="px-10 py-5 bg-brand-blue text-white rounded-2xl font-bold transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-blue-500/20 inline-block relative z-30"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
