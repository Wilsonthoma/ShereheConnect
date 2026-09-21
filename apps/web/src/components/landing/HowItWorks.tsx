import { Search, Ticket, CheckCircle2 } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    { icon: Search, title: 'Discover', desc: 'Browse events by category, location, or date. Find experiences that match your interests.' },
    { icon: Ticket, title: 'Book', desc: 'Select your tickets and pay securely via M-Pesa. Receive instant confirmation.' },
    { icon: CheckCircle2, title: 'Attend', desc: 'Show your QR code at the gate. No printing needed — everything on your phone.' },
  ];

  return (
    <section className="py-16 md:py-24 lg:py-28 bg-light">
      <div className="container-fluid">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="heading-display heading-md text-brand-gradient mb-3 md:mb-4">
            How It Works
          </h2>
          <p className="text-fluid-base text-gray max-w-2xl mx-auto">
            Three simple steps to your next experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 md:mb-6 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg">
                  <Icon className="w-7 h-7 md:w-9 md:h-9 text-white" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-xl md:text-2xl text-dark mb-3">{step.title}</h3>
                <p className="text-fluid-sm text-gray leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
