import { Link } from 'react-router-dom';
import { Rocket, Github, Twitter, Linkedin, Mail, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-brand-dark border-t border-white/5 py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 transition-transform hover:scale-110 border border-white/10">
              <img 
                src={`${import.meta.env.BASE_URL}chatbot-logo.png`} 
                alt="Prince Star" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://ui-avatars.com/api/?name=P&background=3b82f6&color=fff';
                }}
              />
            </div>
            <span className="text-lg font-serif font-bold tracking-tight text-white uppercase whitespace-nowrap">Prince Star</span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            The next generation of AI-driven content and legal intelligence. 
            Empowering users with smart assistance and real-time insights.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-brand-blue/20 transition-all text-gray-400 hover:text-brand-blue">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-brand-blue/20 transition-all text-gray-400 hover:text-brand-blue">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-brand-blue/20 transition-all text-gray-400 hover:text-brand-blue">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-brand-blue/20 transition-all text-gray-400 hover:text-brand-blue">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><Link to="/chat" className="hover:text-brand-blue transition-colors">AI Assistant</Link></li>
            <li><Link to="/blog" className="hover:text-brand-blue transition-colors">Premium Blog</Link></li>
            <li><Link to="/news" className="hover:text-brand-blue transition-colors">Latest News</Link></li>
            <li><Link to="/laws" className="hover:text-brand-blue transition-colors">Legal Database</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><Link to="/about" className="hover:text-brand-blue transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-brand-blue transition-colors">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-brand-blue transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-brand-blue transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Get Updates</h4>
          <p className="text-gray-400 text-sm mb-4">Subscribe to our newsletter for the latest AI insights.</p>
          <div className="flex items-center gap-2 max-w-full">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-blue w-full min-w-0"
            />
            <button className="flex-shrink-0 p-2.5 bg-brand-blue rounded-full hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
              <Mail className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center text-gray-500 text-xs">
        © {new Date().getFullYear()} Prince Star AI. All rights reserved. Built with precision and intelligence.
      </div>
    </footer>
  );
}
