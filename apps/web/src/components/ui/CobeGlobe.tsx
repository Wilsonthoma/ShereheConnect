'use client';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

// Helper to convert Lat/Lng to Cobe's phi/theta angles
const locationToAngles = (lat: number, long: number) => {
  return [
    Math.PI - ((long * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
};

interface CobeGlobeProps {
  className?: string;
}

export function CobeGlobe({ className = '' }: CobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const phiRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Center on Kenya (Lat: -0.0236, Lng: 37.9062)
    const [focusPhi, focusTheta] = locationToAngles(-0.0236, 37.9062);
    phiRef.current = focusPhi;

    // 2. Major towns in Kenya
    const towns = [
      { name: 'Nairobi', location: [-1.2921, 36.8219] as [number, number] },
      { name: 'Mombasa', location: [-4.0435, 39.6682] as [number, number] },
      { name: 'Kisumu', location: [-0.0917, 34.7680] as [number, number] },
      { name: 'Nakuru', location: [-0.3031, 36.0800] as [number, number] },
      { name: 'Eldoret', location: [0.5143, 35.2698] as [number, number] },
      { name: 'Thika', location: [-1.0333, 37.0693] as [number, number] },
    ];

    // 3. Arcs from Nairobi to each town
    const arcs = towns.slice(1).map((town) => ({
      from: [-1.2921, 36.8219] as [number, number],
      to: town.location,
      color: [0.16, 0.67, 0.88] as [number, number, number],
    }));

    // 4. Create the globe (no onRender — we drive updates ourselves)
    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: focusPhi,
      theta: focusTheta,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.16, 0.16, 0.16],
      markerColor: [0.16, 0.67, 0.88],
      glowColor: [0.16, 0.67, 0.88],
      markers: towns.map((t) => ({
        location: t.location,
        size: 0.04,
      })),
      arcs: arcs,
      arcColor: [0.16, 0.67, 0.88],
      arcWidth: 0.5,
      arcHeight: 0.3,
      markerElevation: 0,
    });

    globeRef.current = globe;

    // 5. Animation loop — drive phi manually and call update()
    const animate = () => {
      phiRef.current += 0.003;
      globe.update({ phi: phiRef.current });
      rafRef.current = requestAnimationFrame(animate);
    };

    // Start animation after a short delay (lets texture load)
    const timer = setTimeout(() => {
      animate();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      globe.destroy();
    };
  }, []);

  return (
    <div className={`relative aspect-square w-full max-w-[600px] ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}