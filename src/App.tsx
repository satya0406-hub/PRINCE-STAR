import { useLocation, Routes, Route, HashRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './lib/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { ContentGrid } from './components/ContentGrid';
import { LawsPage } from './pages/LawsPage';
import { ChatAssistantPage } from './pages/ChatPage';
import { AdminDashboard } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { ContactPage } from './pages/ContactPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { ScrollToTop } from './components/ScrollToTop';
import { useBadgeSystem } from './hooks/useBadgeSystem';
import { cn } from './lib/utils';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');
  useBadgeSystem();

  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable common dev tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Ctrl+Shift+I / Cmd+Shift+I (Inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
      }
      // Ctrl+Shift+J / Cmd+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
      }
      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
      }
      // Ctrl+Shift+C / Cmd+Shift+C (Element Inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
      }
      // Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }
      // Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <SplashScreen />
      <div className={cn(
        "flex flex-col selection:bg-brand-blue/30 overflow-x-hidden",
        isChatPage ? "h-screen" : "min-h-screen"
      )}>
        {!isChatPage && <Navbar />}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/blog" element={<ContentGrid category="Blog" title="Premium Insights" />} />
            <Route path="/blog/:id" element={<ArticleDetailPage />} />
            <Route path="/stories" element={<ContentGrid category="Stories" title="Narrative Intelligence" />} />
            <Route path="/stories/:id" element={<ArticleDetailPage />} />
            <Route path="/news" element={<ContentGrid category="News" title="Neural Feed" />} />
            <Route path="/news/:id" element={<ArticleDetailPage />} />
            <Route path="/laws" element={<LawsPage />} />
            <Route path="/laws/:id" element={<ArticleDetailPage />} />
            <Route path="/chat" element={<ChatAssistantPage />} />
            <Route path="/chat/:id" element={<ChatAssistantPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
          </Routes>
        </main>
        {!isChatPage && <Footer />}
      </div>
    </>
  );
}
