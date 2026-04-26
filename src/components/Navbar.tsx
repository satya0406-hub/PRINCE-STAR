import { useAuth } from '../lib/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Rocket, User as UserIcon, LogIn, Award, Sparkles, History, LogOut } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { BadgeModal } from './BadgeModal';
import { AccessLogsModal } from './AccessLogsModal';

export function Navbar() {
  const { user, login, profile, logout, signingIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const isAdmin = user?.email === 'satyamanikantareddysathi@gmail.com';
  const isAssistantPage = location.pathname === '/chat';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Stories', path: '/stories' },
    { name: 'Laws', path: '/laws' },
    { name: 'News', path: '/news' },
    { name: 'Assistant', path: '/chat' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 nav-blur px-4 md:px-10">
      <div className="max-w-7xl mx-auto w-full h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110 border border-white/10">
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
            <span className="font-serif text-xl tracking-wide font-bold text-white uppercase whitespace-nowrap">Prince Star</span>
          </Link>

          {/* Desktop Nav */}
          {location.pathname !== '/chat' && (
            <div className="hidden sm:flex items-center gap-4 md:gap-8">
              <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                      location.pathname === link.path 
                        ? "bg-brand-blue text-white shadow-lg" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              
              {profile?.badges?.length > 0 && (
                  <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/5 h-10">
                    <button
                      onClick={() => setIsBadgeModalOpen(true)}
                      className="flex items-center gap-3 group transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 border border-white/10 bg-[#0b0f1a] transition-transform group-hover:scale-105 active:scale-95 shrink-0">
                        <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="Badges" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col items-start leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-bold text-white tracking-tight">{(profile.totalBadges || 0) + (profile.badges?.length || 0)}</span>
                          <div className="w-4 h-4 rounded-sm overflow-hidden opacity-60 shrink-0">
                            <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="" className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1 group-hover:text-blue-400 transition-colors whitespace-nowrap">View History</span>
                      </div>
                    </button>
                  </div>
              )}
            </div>
          )}

          {location.pathname === '/chat' && (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-sm font-medium text-brand-blue hover:text-blue-300 transition-colors flex items-center gap-2">
                <Rocket className="w-4 h-4" /> Home
              </Link>
              {profile?.badges?.length > 0 && (
                <div className="flex items-center gap-3 pl-4 border-l border-white/5 h-10">
                  <button
                    onClick={() => setIsBadgeModalOpen(true)}
                    className="flex items-center gap-3 group transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 border border-white/10 bg-[#0b0f1a] transition-transform group-hover:scale-105 active:scale-95">
                      <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="Badges" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-white tracking-tight">{(profile.totalBadges || 0) + (profile.badges?.length || 0)}</span>
                        <div className="w-4 h-4 rounded-sm overflow-hidden opacity-60">
                          <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1 group-hover:text-blue-400 transition-colors">View History</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
        
        <div className="hidden sm:flex items-center gap-6 border-l border-white/10 pl-8 ml-4">
          {isAdmin && (
            <>
              <Link to="/admin" className="text-sm font-bold tracking-widest text-slate-300 hover:text-white transition-colors">ADMIN</Link>
              <div className="h-4 w-[1px] bg-white/20" />
            </>
          )}
          
          {/* Removed from here to place next to Home */}

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center p-0.5 rounded-full hover:scale-105 transition-all"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-blue-500/20 border border-white/10">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-blue-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-60 bg-[#0b0f1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Protocol 3.0 Control</p>
                    </div>
                    <div className="py-2">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-brand-blue/10 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                      >
                        <UserIcon className="w-5 h-5 text-brand-blue" /> Profile
                      </Link>
                      <button 
                        onClick={() => {
                          setIsBadgeModalOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-brand-blue/10 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                      >
                        <Award className="w-5 h-5 text-brand-blue" /> Badges
                      </button>
                      <button 
                        onClick={() => {
                          setIsLogsModalOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-brand-blue/10 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                      >
                        <History className="w-5 h-5 text-brand-blue" /> Logs
                      </button>
                      <div className="h-[1px] bg-white/5 my-2" />
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-red-500/10 text-red-500 transition-all text-xs font-bold uppercase tracking-widest"
                      >
                        <LogOut className="w-5 h-5 text-red-500" /> Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={login}
              disabled={signingIn}
              className={cn("btn-primary", signingIn && "opacity-50 cursor-not-allowed")}
            >
              {signingIn ? 'Signing in...' : 'Get Started'}
            </button>
          )}
        </div>

        {/* Mobile menu button and Badges */}
        <div className="sm:hidden flex items-center gap-4 text-white">
          {profile?.badges?.length > 0 && (
            <button
              onClick={() => setIsBadgeModalOpen(true)}
              className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <img src={`${import.meta.env.BASE_URL}badge-logo.png`} alt="Badges" className="w-full h-full object-cover" />
              </div>
              <span className="text-base font-bold text-white mr-1">{(profile.totalBadges || 0) + (profile.badges?.length || 0)}</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-brand-dark/95 border-b border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {location.pathname !== '/chat' ? navLinks.map((link) => (
                <div key={link.path} className="space-y-2">
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block px-3 py-4 rounded-xl text-base font-medium transition-colors",
                      location.pathname === link.path ? "bg-brand-blue/10 text-brand-blue" : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {link.name}
                  </Link>
                </div>
              )) : (
                <div className="space-y-4">
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-4 rounded-xl text-base font-medium text-brand-blue bg-brand-blue/10"
                  >
                    Home
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-4 rounded-xl text-base font-medium text-slate-300 hover:bg-white/5"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              )}
              {!user && (
                <button 
                  onClick={() => { if (!signingIn) { login(); setIsOpen(false); } }}
                  disabled={signingIn}
                  className={cn("w-full text-center mt-4 btn-primary", signingIn && "opacity-50 cursor-not-allowed")}
                >
                  {signingIn ? 'Signing in...' : 'Get Started'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    <BadgeModal isOpen={isBadgeModalOpen} onClose={() => setIsBadgeModalOpen(false)} />
    <AccessLogsModal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} />
    </>
  );
}
