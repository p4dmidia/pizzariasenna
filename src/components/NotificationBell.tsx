import React, { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, Check } from 'lucide-react';
import { toast, useToasterStore } from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('supabase.notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao ler notificações do localStorage:', e);
      }
    }
    return [
      {
        id: '1',
        title: '🍕 Cupom de Desconto!',
        description: 'Ganhe 15% de desconto no seu próximo pedido com o cupom BEMVINDO15.',
        time: '2 min atrás',
        read: false,
      },
      {
        id: '2',
        title: '🔥 Pontos em Dobro!',
        description: 'Todos os pedidos de hoje no Clube 7 ganham pontuação em dobro!',
        time: '1 hora atrás',
        read: false,
      },
      {
        id: '3',
        title: '🎉 Bem-vindo ao Casarão!',
        description: 'Aproveite as melhores pizzas artesanais da região direto na sua casa.',
        time: '1 dia atrás',
        read: true,
      },
    ];
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Persist notifications on change
  useEffect(() => {
    localStorage.setItem('supabase.notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Listen to react-hot-toast store to capture toast messages and convert them to notifications
  const { toasts } = useToasterStore();
  const processedToastsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    toasts.forEach((t) => {
      // Ignore if already processed or if the toast is not active/visible
      if (processedToastsRef.current.has(t.id)) return;
      
      const messageText = typeof t.message === 'string' ? t.message : String(t.message || '');
      if (!messageText) return;

      // Ignore notification bell's own toasts to avoid infinite loop!
      if (messageText.includes('Notificação removida') || 
          messageText.includes('Notificações limpas') || 
          messageText.includes('Todas as notificações foram marcadas como lidas')) {
        // Mark it as processed so we don't check it again
        processedToastsRef.current.add(t.id);
        return;
      }

      processedToastsRef.current.add(t.id);

      // Add to notifications list
      const newNotif = {
        id: `toast-${t.id}-${Date.now()}`,
        title: t.type === 'success' ? '✅ Sucesso!' : t.type === 'error' ? '❌ Alerta!' : '🔔 Notificação',
        description: messageText,
        time: 'Agora',
        read: false,
      };

      setNotifications((prev) => {
        // Prevent duplicate checks for the same message text in the current list
        if (prev.some(n => n.description === messageText && n.time === 'Agora')) {
          return prev;
        }
        return [newNotif, ...prev];
      });
    });
  }, [toasts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('Todas as notificações foram marcadas como lidas!', {
      style: {
        background: '#0B0E14',
        color: '#00E5FF',
        border: '1px solid rgba(0, 229, 255, 0.2)',
      }
    });
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications([]);
    toast.success('Notificações limpas!', {
      style: {
        background: '#0B0E14',
        color: '#00E5FF',
        border: '1px solid rgba(0, 229, 255, 0.2)',
      }
    });
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notificação removida!', {
      style: {
        background: '#0B0E14',
        color: '#00E5FF',
        border: '1px solid rgba(0, 229, 255, 0.2)',
      }
    });
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all relative flex items-center justify-center cursor-pointer"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface/50">
            <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
              🔔 Notificações {unreadCount > 0 && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black">{unreadCount} novas</span>}
            </h3>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={markAllAsRead} 
                  title="Marcar tudo como lido"
                  className="p-1.5 text-text-muted hover:text-primary transition-colors rounded hover:bg-white/5 cursor-pointer"
                >
                  <Check size={16} />
                </button>
                <button 
                  onClick={clearAll} 
                  title="Limpar tudo"
                  className="p-1.5 text-text-muted hover:text-red-400 transition-colors rounded hover:bg-white/5 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm space-y-4">
                <p>Você não possui novas notificações!</p>
                <button 
                  onClick={() => {
                    const defaultNotifs = [
                      {
                        id: '1',
                        title: '🍕 Cupom de Desconto!',
                        description: 'Ganhe 15% de desconto no seu próximo pedido com o cupom BEMVINDO15.',
                        time: '2 min atrás',
                        read: false,
                      },
                      {
                        id: '2',
                        title: '🔥 Pontos em Dobro!',
                        description: 'Todos os pedidos de hoje no Clube 7 ganham pontuação em dobro!',
                        time: '1 hora atrás',
                        read: false,
                      },
                      {
                        id: '3',
                        title: '🎉 Bem-vindo ao Casarão!',
                        description: 'Aproveite as melhores pizzas artesanais da região direto na sua casa.',
                        time: '1 dia atrás',
                        read: true,
                      },
                    ];
                    setNotifications(defaultNotifs);
                  }}
                  className="text-xs text-primary hover:underline font-bold uppercase tracking-wider block mx-auto cursor-pointer"
                >
                  Restaurar Notificações
                </button>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => toggleRead(notification.id)}
                  className={`p-4 hover:bg-surface-hover/50 cursor-pointer transition-colors flex gap-3 items-center group/item ${!notification.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs font-bold ${!notification.read ? 'text-primary' : 'text-text-main'}`}>
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-text-muted whitespace-nowrap">{notification.time}</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-normal">
                      {notification.description}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => deleteNotification(notification.id, e)}
                    title="Apagar notificação"
                    className="p-1.5 text-text-muted/40 hover:text-red-400 hover:bg-white/5 transition-all rounded cursor-pointer self-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
