'use client';

import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { Button } from '@/components/ui';
import { Calendar, Users, TrendingUp, CreditCard, BarChart3, CheckCircle2 } from 'lucide-react';

const BENEFITS = [
  { icon: Calendar, title: 'Easy Event Creation', desc: 'Build and publish events in minutes.' },
  { icon: CreditCard, title: 'M-Pesa Payments', desc: 'Attendees pay directly to your account.' },
  { icon: TrendingUp, title: 'Real-Time Tracking', desc: 'See sales and attendees as they happen.' },
  { icon: Users, title: 'Attendee Management', desc: 'Message, export, and check-in attendees.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Understand your audience and revenue.' },
  { icon: CheckCircle2, title: 'Verified Platform', desc: 'Every event reviewed before going live.' },
];

export default function OrganizersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-light">
        <section className="relative py-20 md:py-28 bg-dark-deep overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative container-fluid text-center">
            <h1 className="heading-display heading-lg text-white mb-6">
              Host Events That
              <br />
              <span className="text-brand-gradient">People Remember</span>
            </h1>
            <p className="text-fluid-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              ShereheConnect gives you everything you need to create, promote, and manage successful events across Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link href="/register">
                <Button variant="primary" size="lg" fullWidth>Start Organizing</Button>
              </Link>
              <Link href="/events">
                <Button variant="outline-light" size="lg" fullWidth>Browse Events</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-light">
          <div className="container-fluid">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="heading-display heading-md text-brand-gradient mb-3 md:mb-4">
                Everything You Need
              </h2>
              <p className="text-fluid-base text-gray max-w-2xl mx-auto">
                Powerful tools built for Kenyan event organizers.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all">
                    <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center mb-5">
                      <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="font-bold text-xl text-dark mb-2">{b.title}</h3>
                    <p className="text-fluid-sm text-gray leading-relaxed">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="container-md text-center">
            <h2 className="heading-display heading-md text-dark mb-6">
              Ready to get started?
            </h2>
            <p className="text-fluid-base text-gray mb-10 max-w-2xl mx-auto">
              Create your organizer account today and start selling tickets.
            </p>
            <Link href="/register">
              <Button variant="primary" size="lg">Create Organizer Account</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
