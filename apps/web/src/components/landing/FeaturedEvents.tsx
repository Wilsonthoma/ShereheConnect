'use client';

import Link from 'next/link';
import { EventCard, CardGrid, Button } from '../ui';

const sampleEvents = [
  { id: '1', title: 'Blankets & Wine 2026', category: 'Festival', venue: 'Ngong Race Course', county: 'Nairobi', date: '15 Mar 2026', price: 1500, originalPrice: 2000, isFeatured: true },
  { id: '2', title: 'Nairobi Tech Summit', category: 'Conference', venue: 'KICC', county: 'Nairobi', date: '22 Apr 2026', price: 5000 },
  { id: '3', title: 'Mombasa Cultural Festival', category: 'Arts & Culture', venue: 'Fort Jesus', county: 'Mombasa', date: '10 May 2026', price: 800 },
  { id: '4', title: 'Kisumu Music Night', category: 'Entertainment', venue: 'Impala Grounds', county: 'Kisumu', date: '5 Jun 2026', price: 1200 },
];

export function FeaturedEvents() {
  return (
    <section className="py-16 md:py-24 lg:py-28 bg-light">
      <div className="container-fluid">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="heading-display heading-md text-brand-gradient mb-3 md:mb-4">
            Featured Events
          </h2>
          <p className="text-fluid-base text-gray max-w-2xl mx-auto">
            Handpicked experiences happening across the country
          </p>
        </div>

        <CardGrid columns={4} className="mb-10 md:mb-12">
          {sampleEvents.map((event) => (
            <EventCard key={event.id} {...event} href={`/events/${event.id}`} onSave={(id) => console.log('Saved', id)} />
          ))}
        </CardGrid>

        <div className="text-center">
          <Link href="/events">
            <Button variant="outline" size="lg">View All Events →</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
