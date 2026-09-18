export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-light p-8">
      <h1 className="font-display text-6xl text-brand-gradient mb-4">
        ShereheConnect
      </h1>
      <p className="font-sans text-lg text-gray mb-8">
        Discover events across Kenya
      </p>
      <button className="bg-gradient-to-br from-gold to-orange text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition">
        Book an Event
      </button>
    </main>
  );
}