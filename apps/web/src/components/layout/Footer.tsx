import Link from 'next/link';
import {
  Calendar,
  Camera,
  Send,
  Briefcase,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-deep text-white border-t border-white/5">
      <div className="container-fluid py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10 lg:gap-8">

          {/* Branding */}
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl text-white tracking-wide">
                  ShereheConnect
                </span>
                <span className="text-[0.65rem] text-gold/80 font-medium tracking-wider uppercase mt-0.5">
                  Discover Events
                </span>
              </div>
            </Link>

            <p className="text-white/60 text-sm mb-6 max-w-sm leading-relaxed">
              Discover, book, and manage events across Kenya with confidence. From festivals to conferences — all in one place.
            </p>

            <div className="flex gap-2.5">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-brand-gradient hover:border-transparent transition-all">
                <Camera className="w-4 h-4" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-brand-gradient hover:border-transparent transition-all">
                <Send className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-brand-gradient hover:border-transparent transition-all">
                <Briefcase className="w-4 h-4" />
              </a>
              <a href="https://wa.me/254743042018" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-brand-gradient hover:border-transparent transition-all">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold/90 mb-5">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-white/60 hover:text-gold transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-gold transition-colors">Contact</Link></li>
              <li><Link href="/customer-stories" className="text-white/60 hover:text-gold transition-colors">Customer Stories</Link></li>
              <li><Link href="/careers" className="text-white/60 hover:text-gold transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold/90 mb-5">Events</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/events" className="text-white/60 hover:text-gold transition-colors">Browse Events</Link></li>
              <li><Link href="/my-tickets" className="text-white/60 hover:text-gold transition-colors">My Tickets</Link></li>
              <li><Link href="/organizers" className="text-white/60 hover:text-gold transition-colors">For Organizers</Link></li>
              <li><Link href="/wishlist" className="text-white/60 hover:text-gold transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold/90 mb-5">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:hello@shereheconnect.co.ke" className="flex items-center gap-2.5 text-white/60 hover:text-gold transition-colors">
                  <Mail className="w-4 h-4 text-gold/60 shrink-0" />
                  <span className="break-all">hello@shereheconnect.co.ke</span>
                </a>
              </li>
              <li>
                <a href="tel:+254743042018" className="flex items-center gap-2.5 text-white/60 hover:text-gold transition-colors">
                  <Phone className="w-4 h-4 text-gold/60 shrink-0" />
                  <span>+254 743 042 018</span>
                </a>
              </li>
              <li>
                <a href="https://maps.google.com/?q=Nairobi,Kenya" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/60 hover:text-gold transition-colors">
                  <MapPin className="w-4 h-4 text-gold/60 shrink-0" />
                  <span>Nairobi, Kenya</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40 text-center md:text-left">
            © 2026 ShereheConnect. All rights reserved. Made with ❤️ in Kenya.
          </p>
          <div className="flex gap-6 text-xs text-white/40">
            <Link href="/terms" className="hover:text-gold transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gold transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-gold transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
