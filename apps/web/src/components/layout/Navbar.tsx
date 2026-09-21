'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Info,
  Bell,
  UserCircle,
  ChevronDown,
  Search,
  Mail,
  HelpCircle,
  Users,
  Shield,
  LogIn,
  Ticket,
  Heart,
  ShoppingBag,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';
import { getUser, getInitials, getRoleLabel, isLoggedIn, clearAuth } from '@/lib/auth';

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  const aboutRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const ticketsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      setLoggedIn(isLoggedIn());
      setUser(getUser());
    };
    sync();
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) setShowAbout(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setShowAccount(false);
      if (ticketsRef.current && !ticketsRef.current.contains(e.target as Node)) setShowTickets(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      window.location.href = `/events?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  const displayName = user?.fullName?.split(' ')[0] || 'Account';
  const initials = user ? getInitials(user.fullName) : 'U';
  const roleLabel = user ? getRoleLabel(user.role) : 'Guest';

  return (
    <>
      <header className="sticky top-0 z-50 bg-dark-deep border-b border-white/5 shadow-lg">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16 md:h-[70px] gap-2 md:gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 md:gap-2.5 shrink-0 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-base md:text-xl text-white tracking-wide">
                  ShereheConnect
                </span>
                <span className="hidden sm:inline text-[0.6rem] md:text-[0.65rem] text-gold/80 font-medium tracking-wider uppercase mt-0.5">
                  Discover Events
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/events"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white/85 hover:text-gold hover:bg-white/5 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Events</span>
              </Link>

              <div
                ref={aboutRef}
                className="relative"
                onMouseEnter={() => setShowAbout(true)}
                onMouseLeave={() => setShowAbout(false)}
              >
                <button
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    showAbout ? 'text-gold bg-white/5' : 'text-white/85 hover:text-gold hover:bg-white/5'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  <span>About</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAbout ? 'rotate-180' : ''}`} />
                </button>
                {showAbout && (
                  <div className="absolute top-full left-0 mt-1 w-60 bg-[#1a2436] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1.5 animate-fade-in-up">
                    <Link href="/contact" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                      <Mail className="w-4 h-4 text-gold/70" />
                      <span>Contact Us</span>
                    </Link>
                    <Link href="/why-shereheconnect" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                      <HelpCircle className="w-4 h-4 text-gold/70" />
                      <span>Why ShereheConnect</span>
                    </Link>
                    <Link href="/customer-stories" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                      <Users className="w-4 h-4 text-gold/70" />
                      <span>Customer Stories</span>
                    </Link>
                    <Link href="/privacy" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                      <Shield className="w-4 h-4 text-gold/70" />
                      <span>Privacy Policy</span>
                    </Link>
                  </div>
                )}
              </div>

              {loggedIn && (
                <div
                  ref={ticketsRef}
                  className="relative"
                  onMouseEnter={() => setShowTickets(true)}
                  onMouseLeave={() => setShowTickets(false)}
                >
                  <button
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      showTickets ? 'text-gold bg-white/5' : 'text-white/85 hover:text-gold hover:bg-white/5'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    <span>My Tickets</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTickets ? 'rotate-180' : ''}`} />
                  </button>
                  {showTickets && (
                    <div className="absolute top-full left-0 mt-1 w-60 bg-[#1a2436] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1.5 animate-fade-in-up">
                      <Link href="/tickets" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                        <Ticket className="w-4 h-4 text-gold/70" />
                        <span>My Tickets</span>
                      </Link>
                      <Link href="/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                        <ShoppingBag className="w-4 h-4 text-gold/70" />
                        <span>My Bookings</span>
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                        <Heart className="w-4 h-4 text-gold/70" />
                        <span>Wishlist</span>
                      </Link>
                      <div className="h-px bg-white/10 my-1" />
                      <Link href="/bookings?status=past" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                        <Calendar className="w-4 h-4 text-gold/70" />
                        <span>Past Bookings</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 w-48 lg:w-72 focus-within:border-gold/50 transition-all"
              >
                <Search className="w-4 h-4 text-white/50 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40 min-w-0"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-full bg-brand-gradient text-white text-xs font-semibold shrink-0 hover:opacity-90 transition"
                >
                  Search
                </button>
              </form>

              <div ref={notifRef} className="relative hidden sm:block">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-all"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red rounded-full ring-2 ring-dark-deep" />
                </button>
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a2436] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">Notifications</h4>
                      <button className="text-xs text-gold hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="px-4 py-8 text-center text-sm text-white/50">
                        No notifications yet
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                ref={accountRef}
                className="relative hidden md:block"
                onMouseEnter={() => setShowAccount(true)}
                onMouseLeave={() => setShowAccount(false)}
              >
                <button
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    showAccount ? 'text-gold bg-white/5' : 'text-white/85 hover:text-gold hover:bg-white/5'
                  }`}
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">{displayName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAccount ? 'rotate-180' : ''}`} />
                </button>
                {showAccount && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a2436] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                    {!loggedIn ? (
                      <div className="py-1.5">
                        <Link href="/login" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                          <LogIn className="w-4 h-4 text-gold/70" />
                          <span>Login</span>
                        </Link>
                        <Link href="/register" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                          <UserPlus className="w-4 h-4 text-gold/70" />
                          <span>Create Account</span>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 border-b border-white/10">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-lg shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-white truncate">
                                {user?.fullName || 'User'}
                              </div>
                              <div className="text-xs text-gold mt-0.5">{roleLabel}</div>
                            </div>
                          </div>
                        </div>
                        <div className="py-1.5">
                          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                            <LayoutDashboard className="w-4 h-4 text-white/50" />
                            <span>Dashboard</span>
                          </Link>
                          <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                            <User className="w-4 h-4 text-white/50" />
                            <span>My Profile</span>
                          </Link>
                          <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors">
                            <Settings className="w-4 h-4 text-white/50" />
                            <span>Settings</span>
                          </Link>
                          <Link href="/notifications" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold bg-white/5 transition-colors">
                            <Bell className="w-4 h-4 text-gold" />
                            <span>Notifications</span>
                          </Link>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div className="py-1.5">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red/90 hover:text-red hover:bg-red/5 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-all"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-dark-deep border-l border-white/10 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-display text-xl text-white">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-all"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              <Link href="/events" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/85 hover:text-gold hover:bg-white/5 transition-all">
                <Calendar className="w-5 h-5" />
                <span>Events</span>
              </Link>

              <div className="pt-2">
                <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold/70">
                  About
                </div>
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                  <Mail className="w-4 h-4" />
                  <span>Contact Us</span>
                </Link>
                <Link href="/why-shereheconnect" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                  <HelpCircle className="w-4 h-4" />
                  <span>Why ShereheConnect</span>
                </Link>
                <Link href="/customer-stories" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                  <Users className="w-4 h-4" />
                  <span>Customer Stories</span>
                </Link>
                <Link href="/privacy" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                  <Shield className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </Link>
              </div>

              {loggedIn && (
                <div className="pt-2">
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold/70">
                    My Tickets
                  </div>
                  <Link href="/tickets" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                    <Ticket className="w-4 h-4" />
                    <span>My Tickets</span>
                  </Link>
                  <Link href="/bookings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                    <ShoppingBag className="w-4 h-4" />
                    <span>My Bookings</span>
                  </Link>
                  <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                    <Heart className="w-4 h-4" />
                    <span>Wishlist</span>
                  </Link>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 mt-4">
                {!loggedIn ? (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/85 hover:text-gold hover:bg-white/5 transition-all">
                      <LogIn className="w-5 h-5" />
                      <span>Login</span>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/85 hover:text-gold hover:bg-white/5 transition-all">
                      <UserPlus className="w-5 h-5" />
                      <span>Create Account</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-white/5">
                      <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate">{user?.fullName}</div>
                        <div className="text-xs text-gold">{roleLabel}</div>
                      </div>
                    </div>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-gold hover:bg-white/5 transition-all">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red/90 hover:text-red hover:bg-red/5 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
