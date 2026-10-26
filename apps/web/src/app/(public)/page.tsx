import { Navbar, Footer } from '@/components/layout';
import {
  Hero,
  FeaturedEvents,
  HowItWorks,
  ForOrganizers,
  WhyShereheConnect,
  CTABand,
} from '@/components/landing';

export default function Home() {
  return (
    <main className="min-h-screen bg-light">
      <Navbar />
      <Hero />
      <FeaturedEvents />
      <HowItWorks />
      <ForOrganizers />
      <WhyShereheConnect />
      <CTABand />
      <Footer />
    </main>
  );
}
