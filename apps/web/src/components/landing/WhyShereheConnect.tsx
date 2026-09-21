import { Shield, Smartphone, BadgeCheck, MapPin } from 'lucide-react';

export function WhyShereheConnect() {
  const reasons = [
    { icon: Shield, title: 'Secure Payments', desc: 'M-Pesa direct to organizer, verified automatically' },
    { icon: Smartphone, title: 'M-Pesa Native', desc: 'Built for Kenya — pay how you already pay' },
    { icon: BadgeCheck, title: 'Verified Events', desc: 'Every event reviewed before going live' },
    { icon: MapPin, title: 'Made for Kenya', desc: 'Designed for local organizers and attendees' },
  ];

  return (
    <section className="py-16 md:py-24 lg:py-28 bg-light">
      <div className="container-fluid">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="heading-display heading-md text-brand-gradient mb-3 md:mb-4">
            Why ShereheConnect?
          </h2>
          <p className="text-fluid-base text-gray max-w-2xl mx-auto">
            What sets us apart
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-brand-gradient flex items-center justify-center mb-4 md:mb-5">
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-lg md:text-xl text-dark mb-2">{r.title}</h3>
                <p className="text-fluid-sm text-gray leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
