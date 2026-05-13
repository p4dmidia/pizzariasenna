import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Zap } from 'lucide-react';
import logoImg from '../assets/logo-casarao.jpeg';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if it's already installed/running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://');
    
    if (isStandalone) {
      console.log('PWA: Already in standalone mode');
      setIsVisible(false);
      return;
    }

    // Check if dismissed recently (within last 7 days)
    const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (lastDismissed) {
      const dismissedDate = new Date(lastDismissed);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        console.log('PWA: Prompt dismissed recently');
        setIsVisible(false);
        return;
      }
    }

    // Check if it's mobile or tablet
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|iphone|ipad|ipod/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 1024;
      return isMobileUA || isSmallScreen;
    };
    
    const mobile = checkMobile();
    setIsMobile(mobile);

    const handler = (e: any) => {
      console.log('PWA: beforeinstallprompt fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS and browsers that don't fire beforeinstallprompt, 
    // we can show the banner after some interaction or time, but only if not standalone
    if (!('onbeforeinstallprompt' in window) && mobile) {
      const timer = setTimeout(() => {
        console.log('PWA: Showing manual install banner for iOS/Other');
        setIsVisible(true);
      }, 8000);
      return () => clearTimeout(timer);
    }

    // Also check if already installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed');
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    setIsVisible(false);
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    } else {
      // If they dismissed the browser prompt, we also treat it as a dismissal
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-6 md:w-[400px]"
      >
        <div className="glass p-6 rounded-[2.5rem] border border-primary/20 shadow-2xl relative overflow-hidden group">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-white transition-all"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl flex-shrink-0">
               <img src={logoImg} alt="App Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg tracking-tighter uppercase leading-none mb-1">
                Instale o <span className="text-primary">Casarão7</span>
              </h3>
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest flex items-center gap-2">
                <Smartphone size={12} className="text-primary" /> Experiência Completa
              </p>
            </div>
          </div>

          <p className="text-xs text-text-muted mb-8 leading-relaxed">
            Peça suas pizzas favoritas com mais agilidade e receba notificações exclusivas de cashback e promoções.
          </p>

          <div className="flex gap-4">
             <button 
               onClick={deferredPrompt ? handleInstall : () => alert('Para instalar, clique nos três pontos (menu) do seu navegador e selecione "Instalar Aplicativo" ou "Adicionar à tela inicial".')}
               className="flex-1 bg-primary text-background py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg glow-primary hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                <Download size={16} /> {deferredPrompt ? 'BAIXAR AGORA' : 'COMO INSTALAR'}
             </button>
             <button 
               onClick={handleDismiss}
               className="px-6 bg-surface/50 border border-surface-border text-text-muted py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
             >
                DEPOIS
             </button>
          </div>

          {/* Quick Tip */}
          <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-primary/60 uppercase tracking-widest">
             <Zap size={10} /> Não ocupa espaço no seu celular
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
