import Link from 'next/link';
import { Button } from '../ui';

export function CTABand() {
  return (
    <section className="relative py-16 md:py-24 lg:py-32 bg-white overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

      <div className="relative container-md text-center">
        <h2 className="heading-display heading-md text-dark mb-5 md:mb-6">
          Ready to discover your
          <br />
          next <span className="text-brand-gradient">experience</span>?
        </h2>

        <p className="text-fluid-base text-gray mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of Kenyans finding events they love — and organizers making them happen.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center">
          <Link href="/register">
            <Button variant="primary" size="lg" fullWidth>Get Started Free →</Button>
          </Link>
          <Link href="/events">
            <Button variant="outline" size="lg" fullWidth>Browse Events</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
