import Link from 'next/link';
import { Button, ImageCarousel } from '../ui';

export function ForOrganizers() {
  const benefits = [
    'Create events in minutes',
    'Accept M-Pesa payments directly',
    'Track sales and attendees in real time',
    'Scan tickets at the gate',
  ];

  const organizerImages = [
    { src: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Concert crowd' },
    { src: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Conference audience' },
    { src: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Live music festival' },
    { src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1200', alt: 'Cultural celebration' },
  ];

  return (
    <section className="py-16 md:py-24 lg:py-28 bg-light">
      <div className="container-fluid">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="heading-display heading-md text-brand-gradient mb-5 md:mb-6">
              Host Events,
              <br />
              Grow Your Audience
            </h2>
            <p className="text-fluid-base text-gray mb-8 md:mb-10 leading-relaxed">
              Join hundreds of organizers using ShereheConnect to create, promote, and manage successful events across Kenya.
            </p>

            <ul className="space-y-4 mb-8 md:mb-10">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-dark">
                  <span className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                  <span className="font-medium text-fluid-sm">{b}</span>
                </li>
              ))}
            </ul>

            <Link href="/register">
              <Button variant="primary" size="lg">Start Organizing →</Button>
            </Link>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <ImageCarousel images={organizerImages} interval={4000} />
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gold/20 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-orange/20 rounded-full blur-3xl pointer-events-none -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
