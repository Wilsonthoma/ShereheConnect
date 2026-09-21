'use client';

import Link from 'next/link';
import { Button, Typewriter } from '../ui';
import { Search, MapPin } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-dark-deep">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1600"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-90"
      >
        <source src="https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4" type="video/mp4" />
        <source src="https://videos.pexels.com/video-files/2022395/2022395-hd_1920_1080_30fps.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      <div
        className="absolute bottom-0 left-0 right-0 h-[45%] z-[2] pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(248,250,252,0) 0%, rgba(248,250,252,0.15) 30%, rgba(248,250,252,0.5) 60%, rgba(248,250,252,0.85) 85%, rgba(248,250,252,1) 100%)',
        }}
      />

      <div className="relative z-[3] container-fluid text-center pt-28 pb-32 md:pt-32 md:pb-40 lg:pb-48">
        <h1 className="heading-display heading-xl text-white mb-6 md:mb-8 drop-shadow-2xl">
          Discover Events
          <br />
          Across Kenya
        </h1>

        <p className="text-fluid-lg md:text-fluid-xl text-white/95 max-w-3xl mx-auto mb-4 leading-relaxed drop-shadow-lg min-h-[2.5em]">
          Find, book, and attend{' '}
          <Typewriter
            words={['festivals.', 'conferences.', 'concerts.', 'workshops.', 'experiences.']}
            className="text-gold-light font-semibold"
          />
        </p>

        <p className="text-fluid-base text-white/80 max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed">
          Kenya&apos;s modern platform for discovering and booking unforgettable experiences.
        </p>

        <div className="max-w-2xl mx-auto mb-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-full shadow-2xl p-2 flex items-center gap-1 md:gap-2 ring-1 ring-white/20">
            <Search className="ml-3 md:ml-4 w-4 h-4 md:w-5 md:h-5 text-gray shrink-0" />
            <input
              type="text"
              placeholder="Search events, venues..."
              className="flex-1 bg-transparent outline-none text-sm py-3 placeholder:text-gray-light min-w-0"
            />
            <button className="hidden sm:flex items-center gap-2 px-3 py-3 text-sm font-medium text-gray hover:text-gold transition shrink-0">
              <MapPin className="w-4 h-4" />
              <span className="hidden lg:inline">Near me</span>
            </button>
            <Link href="/events" className="shrink-0">
              <Button variant="primary" size="sm">Search</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center">
          <Link href="/events">
            <Button variant="primary" size="lg" fullWidth>Browse Events</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline-light" size="lg" fullWidth>Become an Organizer</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
