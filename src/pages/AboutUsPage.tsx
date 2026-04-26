import { motion } from 'motion/react';
import { Target, Users, Zap, Award, Coffee, Code } from 'lucide-react';

export function AboutUsPage() {
  return (
    <div className="pt-32 pb-24 px-4 max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-24"
      >
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-[10px] font-black uppercase tracking-[0.3em] mb-4">
             Discover Our Story
          </div>
          <h1 className="text-6xl md:text-7xl font-serif font-bold tracking-tight leading-[1.1]">
            <span className="text-white">Redefining</span>
            <span className="text-brand-blue ml-4">Intelligence.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Prince Star is more than an AI assistant. It's a neural ecosystem designed to empower human potential through verified insights and intelligent interaction.
          </p>
        </div>

        {/* Mission/Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-10 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-brand-blue/10 transition-colors" />
            <Target className="w-12 h-12 text-brand-blue" />
            <h2 className="text-3xl font-bold font-serif text-white tracking-tight">Our Mission</h2>
            <p className="text-gray-400 leading-relaxed">
              To bridge the gap between complex legal data, real-time insights, and human understanding, providing everyone with a sophisticated AI co-pilot for their toughest questions.
            </p>
          </div>
          <div className="glass-card p-10 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
            <Zap className="w-12 h-12 text-brand-blue" />
            <h2 className="text-3xl font-bold font-serif text-white tracking-tight">Our Vision</h2>
            <p className="text-gray-400 leading-relaxed">
              We envision a future where intelligence is decentralized and accessible, where every individual has the neural tools to navigate law, news, and creative logic with absolute clarity.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="space-y-12">
          <div className="flex items-center gap-4">
             <div className="h-[2px] flex-grow bg-white/5" />
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.5em]">The Core Protocol</h3>
             <div className="h-[2px] flex-grow bg-white/5" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { icon: Award, label: 'Unchecked Quality', desc: 'Verified neural datasets' },
              { icon: Users, label: 'Human Centric', desc: 'Design for natural interaction' },
              { icon: Coffee, label: 'Always Evolving', desc: 'Continuous AI development' },
              { icon: Code, label: 'Secure Code', desc: 'Built on reliable architecture' }
            ].map((value, i) => (
              <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 hover:border-brand-blue/20 transition-colors">
                <value.icon className="w-8 h-8 text-brand-blue mx-auto mb-2" />
                <h4 className="font-bold text-white tracking-tight">{value.label}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="glass-card p-12 text-center bg-brand-blue/5 border-brand-blue/10">
          <h2 className="text-4xl font-bold font-serif text-white mb-6">Born from Innovation.</h2>
          <p className="text-gray-300 max-w-xl mx-auto mb-10 leading-relaxed">
            Prince Star was founded in 2024 to tackle the challenges of modern information overload. We believe that with the right neural partnership, there is no limit to what you can achieve.
          </p>
          <div className="flex items-center justify-center gap-6 saturate-0 opacity-50">
             <img src={`${import.meta.env.BASE_URL}chatbot-logo.png`} alt="Prince Star" className="h-10 grayscale brightness-200 mt-[-10px] mb-[-10px]" />
             <div className="w-1 h-8 bg-white/10" />
             <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Archive 2.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
