'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Ticket, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  metadata?: { eventId?: string, organizerId?: string };
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const user = getUser();
  const role = user?.role;

  const loadNotifications = async () => {
    const token = getToken();
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await api.get<Notification[]>('/notifications', token);
      console.log('🔔 Notifications fetched:', res);
      setNotifications(res);
    } catch (err: any) {
      console.error('🔔 Failed to fetch notifications:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 15 seconds for testing (change back to 30000 later)
    const interval = setInterval(loadNotifications, 15000);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await api.patch(`/notifications/${id}/read`, {}, token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await api.patch('/notifications/read-all', {}, token);
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const getIcon = (type: string) => {
    if (type.includes('KYC')) return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    if (type.includes('EVENT')) return <Ticket className="w-4 h-4 text-blue-500" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  };

  const getLink = (n: Notification) => {
    if (role === 'ADMIN') {
      if (n.type.includes('KYC')) return '/admin/organizers';
      if (n.type.includes('EVENT')) return '/admin/events';
    }
    if (role === 'ORGANIZER') {
      if (n.type.includes('KYC')) return '/organizer/profile';
      if (n.metadata?.eventId) return `/organizer/events/${n.metadata.eventId}`;
    }
    return '#';
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-gold hover:bg-black/5 dark:text-slate-400 dark:hover:text-gold dark:hover:bg-white/5 transition-all"
      >
        <Bell className="w-5 h-5" />
        {/* The Red Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-gold hover:underline">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={getLink(n)}
                  onClick={() => {
                    if (!n.readAt) markAsRead(n.id);
                    setIsOpen(false);
                  }}
                  className={`block px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    !n.readAt ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                    <div className="min-w-0">
                      <p className={`text-sm ${!n.readAt ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[0.65rem] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
