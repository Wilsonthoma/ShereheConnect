'use client';

import { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';

const locationToAngles = (lat: number, long: number): [number, number] => {
  return [
    Math.PI - ((long * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
};

const project = (lat: number, lng: number, phi: number, theta: number, size: number) => {
  const [p, t] = locationToAngles(lat, lng);
  const dx = Math.cos(p) * Math.cos(t);
  const dy = Math.sin(t);
  const dz = Math.sin(p) * Math.cos(t);

  const x = dx * Math.cos(phi) + dz * Math.sin(phi);
  const y = dy * Math.cos(theta) + (dx * Math.sin(phi) - dz * Math.cos(phi)) * Math.sin(theta);

  return {
    x: size / 2 + x * (size / 2) * 0.95,
    y: size / 2 - y * (size / 2) * 0.95,
    visible: Math.cos(p) * Math.cos(t) * Math.cos(phi) + Math.sin(p) * Math.sin(phi) > -0.05,
  };
};

interface CobeGlobeProps {
  className?: string;
}

const TOWNS = [
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
  { name: 'Kisumu', lat: -0.0917, lng: 34.768 },
  { name: 'Nakuru', lat: -0.3031, lng: 36.08 },
  { name: 'Eldoret', lat: 0.5143, lng: 35.2698 },
  { name: 'Thika', lat: -1.0333, lng: 37.0693 },
];

export function CobeGlobe({ className = '' }: CobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const phiRef = useRef(0);
  const globeRef = useRef<any>(null);
  const [positions, setPositions] = useState<{ x: number; y: number; visible: boolean }[]>([]);
  const [size, setSize] = useState(1000); // Large size
  const [isDark, setIsDark] = useState(true);

  // Watch theme
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Track container size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      // Make the globe much bigger than the container so it clips
      setSize(Math.max(w * 1.5, 800)); 
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const [focusPhi, focusTheta] = locationToAngles(-0.0236, 37.9062);
    phiRef.current = focusPhi;

    const arcs = TOWNS.slice(1).map((town) => ({
      from: [-1.2921, 36.8219] as [number, number],
      to: [town.lat, town.lng] as [number, number],
      color: [0.29, 0.72, 1] as [number, number, number],
    }));

    if (globeRef.current) {
      globeRef.current.destroy();
      globeRef.current = null;
    }

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: focusPhi,
      theta: focusTheta,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: isDark ? 6 : 8,
      baseColor: isDark ? [0.16, 0.16, 0.16] : [0.95, 0.95, 0.95],
      markerColor: [1, 0.6, 0],
      glowColor: isDark ? [0.29, 0.72, 1] : [0.16, 0.67, 0.88],
      markers: TOWNS.map((t) => ({
        location: [t.lat, t.lng] as [number, number],
        size: 0.06,
      })),
      arcs,
      arcColor: [0.29, 0.72, 1],
      arcWidth: 0.9,
      arcHeight: 0.5,
      markerElevation: 0.02,
      scale: 2.2, // Zoom in heavily on Kenya
    });
    globeRef.current = globe;

    const animate = () => {
      phiRef.current += 0.002;
      globe.update({ phi: phiRef.current });

      const next = TOWNS.map((t) => {
        const pos = project(t.lat, t.lng, phiRef.current, focusTheta, size);
        return { x: pos.x, y: pos.y, visible: pos.visible };
      });
      setPositions(next);

      rafRef.current = requestAnimationFrame(animate);
    };
    const timer = setTimeout(animate, 100);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      globe.destroy();
      globeRef.current = null;
    };
  }, [size, isDark]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 
        This wrapper handles the clipping. 
        The canvas inside is much larger and positioned to the right.
      */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full scale-[1.6]">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>
      
      {/* HTML labels (re-positioned relative to the visible area) */}
      {TOWNS.map((town, i) => {
        const p = positions[i];
        if (!p || !p.visible) return null;
        return (
          <div
            key={town.name}
            className="absolute pointer-events-none"
            style={{
              left: `${(p.x / size) * 100}%`,
              top: `${(p.y / size) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900 shadow-lg animate-pulse" />
              <span className={`mt-1 text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-md ${
                  isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-slate-900 ring-1 ring-slate-200'
                }`}
              >
                {town.name}
              </span>
            </div>
          </div>
        );
      })}
      
      {/* Radial Gradient Overlay to fade the edges (Coddy style) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark 
            ? 'radial-gradient(circle at 70% 50%, transparent 0%, transparent 40%, rgba(43,43,43,0.8) 70%, #2B2B2B 100%)'
            : 'radial-gradient(circle at 70% 50%, transparent 0%, transparent 40%, rgba(255,255,255,0.8) 70%, #FFFFFF 100%)'
        }}
      />
    </div>
  );
}