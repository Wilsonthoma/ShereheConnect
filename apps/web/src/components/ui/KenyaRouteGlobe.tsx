'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type * as LeafletNamespace from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KENYA_RINGS } from '@/data/kenyaBorder';

interface KenyanCity {
  id: string;
  name: string;
  county: string;
  lat: number;
  lng: number;
}

interface TownHighlight {
  line: string;
  activity: string;
  imageUrl: string;
}

const KENYAN_CITIES: KenyanCity[] = [
  { id: 'mombasa', name: 'Mombasa', county: 'Mombasa', lat: -4.0435, lng: 39.6682 },
  { id: 'nairobi', name: 'Nairobi', county: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  { id: 'nakuru', name: 'Nakuru', county: 'Nakuru', lat: -0.3031, lng: 36.08 },
  { id: 'kisumu', name: 'Kisumu', county: 'Kisumu', lat: -0.0917, lng: 34.768 },
  { id: 'nyeri', name: 'Nyeri', county: 'Nyeri', lat: -0.4201, lng: 36.9476 },
  { id: 'marsabit', name: 'Marsabit', county: 'Marsabit', lat: 2.3284, lng: 37.9899 },
];

// Circular loop: A -> B -> C -> D -> E -> F -> direct from F back to A
const TOUR: string[] = [
  'mombasa',
  'nairobi',
  'nakuru',
  'kisumu',
  'nyeri',
  'marsabit',
  'mombasa',
];

const TOWN_HIGHLIGHTS: Record<string, TownHighlight> = {
  mombasa: {
    line: '001 iko lit—pwani vibes na dhow sunset sessions zimeshika!',
    activity: 'Coastal Sunset & Beach Groove',
    imageUrl:
      'https://images.unsplash.com/flagged/photo-1557828823-b5bb7f45d726?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  nairobi: {
    line: 'Wasee Nairobi kumebamba—nganya culture na live sets ziko juu!',
    activity: 'City Nightlife & Live Sessions',
    imageUrl:
      'https://images.unsplash.com/photo-1669127300649-940337f1487e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  nakuru: {
    line: 'Nakuru iko chonjo—road trips, park views na sports vibes zimeiva!',
    activity: 'Rift Valley Sports & Outings',
    imageUrl:
      'https://plus.unsplash.com/premium_photo-1661846340419-89bf27138124?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  kisumu: {
    line: 'Dala iko fiti—lakeside breeze, fish fry na groove zimetiki!',
    activity: 'Lakefront Hangouts & Music',
    imageUrl:
      'https://images.unsplash.com/photo-1751568928462-e90c4dcae0a4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  nyeri: {
    line: 'Wasee Nyeri ni mambo mbaya—highland trails na weekend hangs ziko juu!',
    activity: 'Highland Trails & Weekend Hangs',
    imageUrl:
      'https://images.unsplash.com/photo-1658394182922-fae0590632d6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  marsabit: {
    line: 'Mbogi imefika Marsabit—desert horizons na adventure vibes zimeiva!',
    activity: 'Northern Frontier Adventure',
    imageUrl:
      'https://images.unsplash.com/photo-1515657241610-a6b33f0f6c5a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
};

const ARRIVAL_POP_DELAY_MS = 450;
const ARRIVAL_POP_DURATION_MS = 3800;

function legDurationMs(lengthDeg: number): number {
  const safeLen = Number.isFinite(lengthDeg) && lengthDeg > 0 ? lengthDeg : 0;
  const ms = 5000 + 1750 * Math.pow(safeLen, 0.72);
  return Math.min(13000, Math.max(6000, ms));
}

interface Leg {
  from: string;
  to: string;
  coords: Array<[number, number]>;
  durationMs: number;
}

function isValidLatLngTuple(pt: unknown): pt is [number, number] {
  return (
    Array.isArray(pt) &&
    pt.length >= 2 &&
    typeof pt[0] === 'number' &&
    typeof pt[1] === 'number' &&
    Number.isFinite(pt[0]) &&
    Number.isFinite(pt[1]) &&
    Math.abs(pt[0]) <= 90 &&
    Math.abs(pt[1]) <= 180
  );
}

function sanitizeRings(
  rings: unknown,
): LeafletNamespace.LatLngExpression[][][] {
  if (!Array.isArray(rings)) return [];
  return rings
    .map((ring) => {
      if (!Array.isArray(ring)) return [];
      return ring
        .filter(isValidLatLngTuple)
        .map(([lat, lng]) => [lat, lng] as LeafletNamespace.LatLngTuple);
    })
    .filter((ring) => ring.length >= 3)
    .map((ring) => [ring]);
}

function pathLengthDeg(coords: Array<[number, number]>): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1];
    const b = coords[i];
    if (!isValidLatLngTuple(a) || !isValidLatLngTuple(b)) continue;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

function resampleByArcLength(
  coords: Array<[number, number]>,
  samples = 360,
): Array<[number, number]> {
  const validCoords = coords.filter(isValidLatLngTuple);
  if (validCoords.length < 2) return validCoords;

  const cumDist: number[] = [0];
  for (let i = 1; i < validCoords.length; i++) {
    const d = Math.hypot(
      validCoords[i][0] - validCoords[i - 1][0],
      validCoords[i][1] - validCoords[i - 1][1],
    );
    cumDist.push(cumDist[i - 1] + d);
  }

  const totalDist = cumDist[cumDist.length - 1];
  if (!Number.isFinite(totalDist) || totalDist === 0) {
    return [validCoords[0], validCoords[validCoords.length - 1]];
  }

  const out: Array<[number, number]> = [];
  let segIdx = 0;

  for (let s = 0; s <= samples; s++) {
    const targetDist = (s / samples) * totalDist;
    while (segIdx < cumDist.length - 2 && cumDist[segIdx + 1] < targetDist) {
      segIdx++;
    }
    const segStart = cumDist[segIdx];
    const segEnd = cumDist[segIdx + 1];
    const span = segEnd - segStart;
    const alpha = span > 0 ? (targetDist - segStart) / span : 0;

    const a = validCoords[segIdx];
    const b = validCoords[segIdx + 1];
    const lat = a[0] + (b[0] - a[0]) * alpha;
    const lng = a[1] + (b[1] - a[1]) * alpha;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      out.push([lat, lng]);
    }
  }

  return out.length >= 2 ? out : [validCoords[0], validCoords[validCoords.length - 1]];
}

const LEFT_RESERVE_DESKTOP = 0.42;
const LEFT_RESERVE_TABLET = 0.18;

function bearingDeg(from: [number, number], to: [number, number]): number {
  if (!isValidLatLngTuple(from) || !isValidLatLngTuple(to)) return 0;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return Number.isFinite(deg) ? deg : 0;
}

async function fetchRoadPoints(
  origin: KenyanCity,
  dest: KenyanCity,
  signal: AbortSignal,
  directOnly = false,
): Promise<Array<[number, number]>> {
  const direct: Array<[number, number]> = resampleByArcLength(
    [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ],
    360,
  );

  if (directOnly) {
    return direct;
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
    if (!res.ok) return direct;
    const data = await res.json();
    const rawCoords: Array<[number, number]> | undefined =
      data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(rawCoords) || rawCoords.length < 2) return direct;
    const latLngs: Array<[number, number]> = rawCoords
      .filter(
        (pair): pair is [number, number] =>
          Array.isArray(pair) &&
          pair.length >= 2 &&
          Number.isFinite(pair[0]) &&
          Number.isFinite(pair[1]),
      )
      .map(([lng, lat]) => [lat, lng]);
    if (latLngs.length < 2) return direct;
    return resampleByArcLength(latLngs, 360);
  } catch {
    return direct;
  }
}

function detectDarkTheme(propTheme?: 'light' | 'dark'): boolean {
  if (propTheme === 'dark') return true;
  if (propTheme === 'light') return false;
  if (typeof document === 'undefined') return true;

  const html = document.documentElement;
  const body = document.body;
  const attrTheme =
    html.getAttribute('data-theme') ||
    html.getAttribute('data-color-mode') ||
    body?.getAttribute('data-theme') ||
    body?.getAttribute('data-color-mode');

  if (attrTheme === 'dark') return true;
  if (attrTheme === 'light') return false;
  if (html.classList.contains('dark') || body?.classList.contains('dark')) {
    return true;
  }
  if (html.classList.contains('light') || body?.classList.contains('light')) {
    return false;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

export interface KenyaRouteGlobeProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export function KenyaRouteGlobe({
  className = '',
  theme,
}: KenyaRouteGlobeProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletNamespace.Map | null>(null);
  const slabLayerRef = useRef<LeafletNamespace.Polygon | null>(null);
  const outlineLayerRef = useRef<LeafletNamespace.Polygon | null>(null);
  const traveledLineRef = useRef<LeafletNamespace.Polyline | null>(null);
  const carMarkerRef = useRef<LeafletNamespace.Marker | null>(null);
  const carRotatorRef = useRef<HTMLElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const isPausedRef = useRef<boolean>(false);
  const bubbleHoveredRef = useRef<boolean>(false);
  const hoveredVisitedTownRef = useRef<boolean>(false);
  const visitedTownsRef = useRef<Set<string>>(new Set());

  const [isDark, setIsDark] = useState<boolean>(() => detectDarkTheme(theme));
  const [legs, setLegs] = useState<Leg[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [arrivedTownId, setArrivedTownId] = useState<string | null>(null);
  const [arrivedTownName, setArrivedTownName] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<TownHighlight | null>(
    null,
  );
  const [alertPulseKey, setAlertPulseKey] = useState<number>(0);
  const [imgBroken, setImgBroken] = useState<boolean>(false);
  const [popPos, setPopPos] = useState<{ x: number; y: number; w: number } | null>(
    null,
  );

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(detectDarkTheme(theme));
    };
    updateTheme();

    if (theme !== undefined || typeof document === 'undefined') return;

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-color-mode'],
    });
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'data-color-mode'],
      });
    }

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', updateTheme);

    return () => {
      observer.disconnect();
      media?.removeEventListener('change', updateTheme);
    };
  }, [theme]);

  useEffect(() => {
    slabLayerRef.current?.setStyle({
      fillColor: isDark ? '#0b2a45' : '#e0f2fe',
      fillOpacity: isDark ? 0.96 : 0.95,
    });
    outlineLayerRef.current?.setStyle({
      color: isDark ? '#38bdf8' : '#0284c7',
      opacity: isDark ? 0.95 : 0.9,
    });
    traveledLineRef.current?.setStyle({
      color: isDark ? '#38bdf8' : '#0284c7',
    });
  }, [isDark]);

  const arrivedIdRef = useRef<string | null>(arrivedTownId);
  arrivedIdRef.current = arrivedTownId;

  const updatePopPos = useCallback(() => {
    const wrapper = wrapperRef.current;
    const id = arrivedIdRef.current;
    if (!wrapper || !id) return;
    const dot = wrapper.querySelector<HTMLElement>(
      `.kc-pin[data-city="${id}"] .kc-dot`,
    );
    if (!dot) return;
    const w = wrapper.getBoundingClientRect();
    const d = dot.getBoundingClientRect();
    if (
      !Number.isFinite(w.width) ||
      !Number.isFinite(w.height) ||
      w.width <= 0 ||
      w.height <= 0
    ) {
      return;
    }
    const x = d.left + d.width / 2 - w.left;
    const y = d.top + d.height / 2 - w.top;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    setPopPos({ x, y, w: w.width });
  }, []);
  const updatePopPosRef = useRef(updatePopPos);
  updatePopPosRef.current = updatePopPos;

  const dismissBubble = useCallback(() => {
    bubbleHoveredRef.current = false;
    hoveredVisitedTownRef.current = false;
    setArrivedTownId(null);
    setArrivedTownName(null);
    setActiveHighlight(null);
    setPopPos(null);
  }, []);

  const openTownBubble = useCallback((townId: string) => {
    const city = KENYAN_CITIES.find((c) => c.id === townId);
    const name = city?.name ?? townId;
    const highlight = TOWN_HIGHLIGHTS[townId] ?? {
      line: `Wasee ${name} kumebamba—wacha tucheki vibe ya hapa!`,
      activity: `${name} Spot & Groove`,
      imageUrl:
        'https://images.unsplash.com/photo-1669127300649-940337f1487e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    };

    setArrivedTownId(townId);
    setArrivedTownName(name);
    setActiveHighlight(highlight);
    setImgBroken(false);
    setAlertPulseKey((k) => k + 1);
  }, []);

  const setScreenPaused = useCallback((paused: boolean) => {
    isPausedRef.current = paused;
    setIsPaused(paused);
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || typeof window === 'undefined') return;

    let cancelled = false;
    let map: LeafletNamespace.Map | null = null;
    let observer: ResizeObserver | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const pin = target?.closest<HTMLElement>('.kc-pin');
      if (!pin) return;
      const cityId = pin.dataset.city;
      if (!cityId || !visitedTownsRef.current.has(cityId)) return;
      hoveredVisitedTownRef.current = true;
      openTownBubble(cityId);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const pin = target?.closest<HTMLElement>('.kc-pin');
      if (!pin) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related && pin.contains(related)) return;
      if (!hoveredVisitedTownRef.current) return;
      hoveredVisitedTownRef.current = false;
      if (!bubbleHoveredRef.current) {
        dismissBubble();
      }
    };

    import('leaflet').then((leafletMod) => {
      if (cancelled || !mapContainerRef.current || mapInstanceRef.current) {
        return;
      }

      const L = leafletMod.default ?? leafletMod;
      const kenyaBounds = L.latLngBounds([-4.75, 33.85], [5.1, 41.95]);

      const instance = L.map(container, {
        center: [0.2, 37.9],
        zoom: 6,
        zoomSnap: 0,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomAnimation: false,
        fadeAnimation: false,
      });
      map = instance;

      container.style.background = 'transparent';

      const fitKenya = () => {
        if (!mapContainerRef.current) return;
        const { clientWidth: w, clientHeight: h } = mapContainerRef.current;
        if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
          return;
        }

        instance.invalidateSize({ animate: false });

        const reserve =
          w >= 1024 ? LEFT_RESERVE_DESKTOP : w >= 640 ? LEFT_RESERVE_TABLET : 0;
        const padLeft = Math.max(0, Math.round(w * reserve) + 16);

        instance.fitBounds(kenyaBounds, {
          paddingTopLeft: [padLeft, 56],
          paddingBottomRight: [72, 64],
          animate: false,
        });
      };

      const initialDark = detectDarkTheme(theme);
      const safeRings = sanitizeRings(KENYA_RINGS);

      slabLayerRef.current = L.polygon(safeRings, {
        stroke: false,
        fillColor: initialDark ? '#0b2a45' : '#e0f2fe',
        fillOpacity: initialDark ? 0.96 : 0.95,
        className: 'kenya-slab',
        interactive: false,
      }).addTo(instance);

      outlineLayerRef.current = L.polygon(safeRings, {
        color: initialDark ? '#38bdf8' : '#0284c7',
        weight: 2,
        opacity: initialDark ? 0.95 : 0.9,
        fill: false,
        lineJoin: 'round',
        className: 'kenya-outline',
        interactive: false,
      }).addTo(instance);

      KENYAN_CITIES.forEach((city) => {
        if (!isValidLatLngTuple([city.lat, city.lng])) return;
        const icon = L.divIcon({
          className: 'kenya-city-pin',
          html: `
            <div class="kc-pin" data-city="${city.id}">
              <span class="kc-beam" aria-hidden="true"></span>
              <span class="kc-label">
                <svg class="kc-loc-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>
                </svg>
                <span>${city.name}</span>
              </span>
              <span class="kc-dot"><i class="kc-ring"></i></span>
            </div>
          `,
          iconSize: [128, 56],
          iconAnchor: [64, 48],
        });
        L.marker([city.lat, city.lng], {
          icon,
          interactive: false,
        }).addTo(instance);
      });

      container.addEventListener('mouseover', handleMouseOver);
      container.addEventListener('mouseout', handleMouseOut);

      traveledLineRef.current = L.polyline([], {
        color: initialDark ? '#38bdf8' : '#0284c7',
        weight: 4,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(instance);

      const carIcon = L.divIcon({
        className: 'kenya-car-pin',
        html: `
          <div class="kenya-car-rotator" style="width:36px;height:66px;position:relative;will-change:transform;">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 44 84" width="30" height="56" style="overflow:visible;display:block" aria-hidden="true">
                <defs>
                  <linearGradient id="kcPaint" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#0369a1"/>
                    <stop offset="0.28" stop-color="#7dd3fc"/>
                    <stop offset="0.55" stop-color="#38bdf8"/>
                    <stop offset="1" stop-color="#075985"/>
                  </linearGradient>
                  <linearGradient id="kcRoof" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#e0f2fe"/>
                    <stop offset="1" stop-color="#38bdf8"/>
                  </linearGradient>
                  <linearGradient id="kcGlass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#0c4a6e"/>
                    <stop offset="1" stop-color="#020617"/>
                  </linearGradient>
                  <linearGradient id="kcBeam" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stop-color="#fef9c3" stop-opacity="0.8"/>
                    <stop offset="1" stop-color="#fef9c3" stop-opacity="0"/>
                  </linearGradient>
                  <filter id="kcSoft" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3"/>
                  </filter>
                </defs>

                <ellipse cx="22" cy="50" rx="20" ry="37" fill="rgba(0,0,0,0.5)" filter="url(#kcSoft)"/>

                <g class="kc-beams">
                  <polygon points="10,8 2,-28 22,-28" fill="url(#kcBeam)"/>
                  <polygon points="34,8 22,-28 42,-28" fill="url(#kcBeam)"/>
                </g>

                <rect x="1.5" y="14" width="7" height="15" rx="2.5" fill="#05080f"/>
                <rect x="35.5" y="14" width="7" height="15" rx="2.5" fill="#05080f"/>
                <rect x="1.5" y="54" width="7" height="15" rx="2.5" fill="#05080f"/>
                <rect x="35.5" y="54" width="7" height="15" rx="2.5" fill="#05080f"/>

                <path d="M22 7 C31 7 36 11 37 19 L38 43 L37 70 C37 78 31 83 22 83 C13 83 7 78 7 70 L6 43 L7 19 C8 11 13 7 22 7Z" fill="#075985"/>

                <rect x="2.5" y="26" width="5" height="4.5" rx="1.6" fill="#0284c7"/>
                <rect x="36.5" y="26" width="5" height="4.5" rx="1.6" fill="#0284c7"/>

                <path d="M22 3 C31 3 36 7 37 15 L38 40 L37 66 C37 74 31 79 22 79 C13 79 7 74 7 66 L6 40 L7 15 C8 7 13 3 22 3Z" fill="url(#kcPaint)" stroke="rgba(255,255,255,0.75)" stroke-width="1"/>

                <path d="M13 10 C17 6.5 27 6.5 31 10 L30 24 L14 24Z" fill="rgba(255,255,255,0.28)"/>
                <line x1="22" y1="6" x2="22" y2="24" stroke="rgba(255,255,255,0.35)" stroke-width="0.7"/>

                <path d="M11.5 26 L32.5 26 L30.5 37 L13.5 37Z" fill="url(#kcGlass)"/>
                <rect x="13" y="36.5" width="18" height="21" rx="4.5" fill="url(#kcRoof)"/>
                <path d="M13.5 57 L30.5 57 L33 66 L11 66Z" fill="url(#kcGlass)"/>
                <rect x="8.6" y="30" width="3" height="30" rx="1.5" fill="rgba(2,6,23,0.55)"/>
                <rect x="32.4" y="30" width="3" height="30" rx="1.5" fill="rgba(2,6,23,0.55)"/>

                <ellipse cx="12" cy="8.5" rx="3.2" ry="2" fill="#fef9c3"/>
                <ellipse cx="32" cy="8.5" rx="3.2" ry="2" fill="#fef9c3"/>
                <rect class="kc-tail" x="9" y="75" width="7" height="2.6" rx="1.2"/>
                <rect class="kc-tail" x="28" y="75" width="7" height="2.6" rx="1.2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 66],
        iconAnchor: [18, 33],
      });

      const start = KENYAN_CITIES.find((c) => c.id === TOUR[0]) ?? KENYAN_CITIES[0];
      const car = L.marker([start.lat, start.lng], {
        icon: carIcon,
        interactive: false,
        zIndexOffset: 500,
      }).addTo(instance);
      carMarkerRef.current = car;
      carRotatorRef.current =
        container.querySelector('.kenya-car-rotator') as HTMLElement | null;

      fitKenya();
      mapInstanceRef.current = instance;

      observer = new ResizeObserver(() => {
        fitKenya();
        window.requestAnimationFrame(() => updatePopPosRef.current());
      });
      observer.observe(container);
    });

    return () => {
      cancelled = true;
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
      observer?.disconnect();
      map?.remove();
      mapInstanceRef.current = null;
      slabLayerRef.current = null;
      outlineLayerRef.current = null;
      traveledLineRef.current = null;
      carMarkerRef.current = null;
      carRotatorRef.current = null;
    };
  }, [dismissBubble, openTownBubble, theme]);

  useEffect(() => {
    if (!arrivedTownId) return;
    const raf = window.requestAnimationFrame(() => updatePopPos());
    return () => window.cancelAnimationFrame(raf);
  }, [arrivedTownId, alertPulseKey, legs, updatePopPos]);

  useEffect(() => {
    const controller = new AbortController();
    const byId = new Map(KENYAN_CITIES.map((c) => [c.id, c]));
    const cache = new Map<string, Array<[number, number]>>();

    const load = async () => {
      const built: Leg[] = [];
      for (let i = 0; i < TOUR.length - 1; i++) {
        const a = byId.get(TOUR[i]);
        const b = byId.get(TOUR[i + 1]);
        if (!a || !b) continue;
        // Final leg (F -> A) goes directly from Marsabit back to Mombasa
        const isReturnDirect = i === TOUR.length - 2;
        const key = `${a.id}>${b.id}:${isReturnDirect ? 'direct' : 'road'}`;
        let coords = cache.get(key);
        if (!coords) {
          coords = await fetchRoadPoints(
            a,
            b,
            controller.signal,
            isReturnDirect,
          );
          if (controller.signal.aborted) return;
          cache.set(key, coords);
        }
        const safeCoords = coords.filter(isValidLatLngTuple);
        if (safeCoords.length < 2) continue;
        const durationMs = legDurationMs(pathLengthDeg(safeCoords));
        built.push({ from: a.id, to: b.id, coords: safeCoords, durationMs });
      }
      if (!controller.signal.aborted) setLegs(built);
    };
    load();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (legs.length === 0) return;

    const container = mapContainerRef.current;
    visitedTownsRef.current = new Set([legs[0].from]);

    const stitchedCoords: Array<[number, number]> = [];
    const legStartIndices: number[] = [];
    legs.forEach((leg, idx) => {
      legStartIndices.push(stitchedCoords.length);
      if (idx === 0) {
        stitchedCoords.push(...leg.coords);
      } else {
        stitchedCoords.push(...leg.coords.slice(1));
      }
    });

    const setActivePin = (id: string | null) => {
      if (!container) return;
      container.querySelectorAll<HTMLElement>('.kc-pin').forEach((el) => {
        el.classList.toggle('is-active', el.dataset.city === id);
      });
    };

    const markTownCovered = (id: string) => {
      visitedTownsRef.current.add(id);
      container
        ?.querySelector<HTMLElement>(`.kc-pin[data-city="${id}"]`)
        ?.classList.add('is-revealed', 'is-visited');
    };

    let popDelayTimeout: number | null = null;
    let popHideTimeout: number | null = null;

    const scheduleAutoHide = () => {
      if (popHideTimeout !== null) {
        window.clearTimeout(popHideTimeout);
      }
      popHideTimeout = window.setTimeout(() => {
        if (bubbleHoveredRef.current || hoveredVisitedTownRef.current) {
          scheduleAutoHide();
          return;
        }
        dismissBubble();
      }, ARRIVAL_POP_DURATION_MS);
    };

    const showArrivalThought = (townId: string) => {
      markTownCovered(townId);
      setActivePin(townId);

      if (popDelayTimeout !== null) {
        window.clearTimeout(popDelayTimeout);
      }

      popDelayTimeout = window.setTimeout(() => {
        openTownBubble(townId);
        scheduleAutoHide();
      }, ARRIVAL_POP_DELAY_MS);
    };

    const headingOf = (coords: Array<[number, number]>, i: number) => {
      const lookahead = Math.min(i + 28, coords.length - 1);
      const fromIdx = Math.min(i, Math.max(0, lookahead - 1));
      return bearingDeg(coords[fromIdx], coords[lookahead]);
    };

    let heading = headingOf(legs[0].coords, 0);
    const applyHeading = (deg: number) => {
      if (!Number.isFinite(deg)) return;
      heading = ((deg % 360) + 360) % 360;
      const rotator =
        carRotatorRef.current ??
        (container?.querySelector('.kenya-car-rotator') as HTMLElement | null);
      if (rotator) {
        carRotatorRef.current = rotator;
        rotator.style.transform = `rotate(${heading.toFixed(2)}deg)`;
      }
    };

    const turnToward = (target: number, dtMs: number, tauMs: number) => {
      if (!Number.isFinite(target)) return;
      const delta = ((target - heading + 540) % 360) - 180;
      if (Math.abs(delta) < 0.25) return;
      const next = heading + delta * (1 - Math.exp(-dtMs / Math.max(tauMs, 1)));
      applyHeading(next);
    };

    const setCarState = (moving: boolean, braking: boolean) => {
      const el =
        carRotatorRef.current ??
        (container?.querySelector('.kenya-car-rotator') as HTMLElement | null);
      if (!el) return;
      carRotatorRef.current = el;
      el.classList.toggle('is-moving', moving);
      el.classList.toggle('is-braking', braking);
    };

    let rafId = 0;
    let legIndex = 0;
    const startPerf = performance.now();
    let moveStart = startPerf;
    let lastNow: number | null = null;

    const first = legs[0];
    if (isValidLatLngTuple(first.coords[0])) {
      carMarkerRef.current?.setLatLng(first.coords[0]);
      traveledLineRef.current?.setLatLngs([first.coords[0]]);
    }
    markTownCovered(first.from);
    applyHeading(heading);
    setCarState(true, false);

    const tick = (now: number) => {
      if (lastNow === null) {
        lastNow = now;
        moveStart = now;
      }
      const dt = Math.min(Math.max(now - lastNow, 0), 50);
      lastNow = now;

      if (isPausedRef.current) {
        moveStart += dt;
        setCarState(false, false);
        rafId = requestAnimationFrame(tick);
        return;
      }

      const leg = legs[legIndex];
      const rawT = Math.min(Math.max((now - moveStart) / leg.durationMs, 0), 1);
      const eased =
        rawT < 0.5
          ? 16 * rawT * rawT * rawT * rawT * rawT
          : 1 - Math.pow(-2 * rawT + 2, 5) / 2;

      const coords = leg.coords;
      const scaledIndex = eased * (coords.length - 1);
      const idx = Math.min(Math.floor(scaledIndex), coords.length - 2);
      const frac = scaledIndex - idx;

      const p1 = coords[idx];
      const p2 = coords[idx + 1];
      const lat = p1[0] + (p2[0] - p1[0]) * frac;
      const lng = p1[1] + (p2[1] - p1[1]) * frac;
      const currentPt: [number, number] = [lat, lng];

      if (isValidLatLngTuple(currentPt)) {
        carMarkerRef.current?.setLatLng(currentPt);
        // Only steer while in transit; hold heading steady when arriving at a town
        if (rawT < 0.9) {
          turnToward(headingOf(coords, idx), dt, 340);
        }
        setCarState(rawT < 0.99, rawT > 0.9);

        const baseIndex = legStartIndices[legIndex] ?? 0;
        const drivenEnd = Math.min(baseIndex + idx + 1, stitchedCoords.length);
        const linePts = [
          ...stitchedCoords.slice(0, drivenEnd).filter(isValidLatLngTuple),
          currentPt,
        ];
        traveledLineRef.current?.setLatLngs(linePts);
      }

      if (rawT >= 1) {
        showArrivalThought(leg.to);

        legIndex = (legIndex + 1) % legs.length;
        if (legIndex === 0 && isValidLatLngTuple(legs[0].coords[0])) {
          traveledLineRef.current?.setLatLngs([legs[0].coords[0]]);
        }
        moveStart = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      if (popDelayTimeout !== null) window.clearTimeout(popDelayTimeout);
      if (popHideTimeout !== null) window.clearTimeout(popHideTimeout);
      setActivePin(null);
    };
  }, [legs, dismissBubble, openTownBubble]);

  const showThoughtPop = Boolean(arrivedTownName && activeHighlight && popPos);

  const BUBBLE_W = popPos && popPos.w < 640 ? 248 : 276;
  const bubbleX = popPos
    ? Math.min(
        Math.max(popPos.x, BUBBLE_W / 2 + 12),
        Math.max(popPos.w - BUBBLE_W / 2 - 12, BUBBLE_W / 2 + 12),
      )
    : 0;
  const bubbleY = popPos ? Math.max(popPos.y - 48, 136) : 0;
  const puffOffset = popPos
    ? Math.max(
        Math.min(popPos.x - bubbleX, BUBBLE_W / 2 - 28),
        -(BUBBLE_W / 2 - 28),
      )
    : 0;

  return (
    <div
      ref={wrapperRef}
      data-globe-theme={isDark ? 'dark' : 'light'}
      className={`kc-globe-root relative w-full h-full overflow-hidden select-none cursor-pointer ${
        isDark ? 'kc-theme-dark' : 'kc-theme-light'
      } ${className}`}
      style={{ perspective: '1400px' }}
      onPointerDown={() => setScreenPaused(true)}
      onPointerUp={() => setScreenPaused(false)}
      onPointerCancel={() => setScreenPaused(false)}
      onPointerLeave={() => setScreenPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 38% 50% at 72% 52%, rgba(56,189,248,0.18), rgba(56,189,248,0) 70%)'
            : 'radial-gradient(ellipse 38% 50% at 72% 52%, rgba(2,132,199,0.16), rgba(2,132,199,0) 70%)',
        }}
      />

      <div
        ref={mapContainerRef}
        className="absolute inset-0 origin-center"
        style={{ transform: 'rotateX(24deg) rotateZ(-3deg)' }}
      />

      {isPaused && (
        <div
          className={`pointer-events-none absolute top-4 right-4 z-[460] rounded-full px-3 py-1 text-[11px] font-semibold shadow-lg border ${
            isDark
              ? 'bg-slate-950/90 border-sky-400/50 text-sky-300'
              : 'bg-white/95 border-sky-600/35 text-sky-800'
          }`}
        >
          Paused — release screen to continue
        </div>
      )}

      {showThoughtPop && activeHighlight && (
        <div
          key={`thought-${alertPulseKey}`}
          className="kc-thought-pop pointer-events-auto absolute z-[450]"
          style={{
            left: `${bubbleX}px`,
            top: `${bubbleY}px`,
            width: `${BUBBLE_W}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onMouseEnter={() => {
            bubbleHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            bubbleHoveredRef.current = false;
            if (!hoveredVisitedTownRef.current) {
              dismissBubble();
            }
          }}
        >
          <div
            className={`kc-bubble-shell relative backdrop-blur-xl p-3 ${
              isDark
                ? 'bg-slate-950/95 border border-sky-400/55 shadow-[0_18px_42px_rgba(0,0,0,0.75)]'
                : 'bg-white/95 border border-sky-600/35 shadow-[0_18px_42px_rgba(15,23,42,0.18)]'
            }`}
          >
            <div
              className={`relative h-24 w-full overflow-hidden rounded-2xl border ${
                isDark
                  ? 'border-sky-400/25 bg-gradient-to-br from-sky-900 via-slate-900 to-sky-950'
                  : 'border-sky-600/20 bg-gradient-to-br from-sky-100 via-slate-100 to-sky-200'
              }`}
            >
              {!imgBroken && (
                <img
                  src={activeHighlight.imageUrl}
                  alt={activeHighlight.activity}
                  className="block h-full w-full object-cover object-center"
                  onError={() => setImgBroken(true)}
                />
              )}
              <div
                className={`pointer-events-none absolute inset-0 ${
                  isDark
                    ? 'bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent'
                    : 'bg-gradient-to-t from-slate-900/80 via-slate-900/15 to-transparent'
                }`}
              />
              <div
                className={`absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                  isDark
                    ? 'bg-slate-950/85 border-sky-400/45 text-sky-300'
                    : 'bg-white/90 border-sky-600/30 text-sky-800'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{arrivedTownName}</span>
              </div>
              <div className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-semibold text-white drop-shadow truncate">
                {activeHighlight.activity}
              </div>
            </div>

            <p
              className={`mt-2.5 px-1 text-[12.5px] leading-snug font-medium ${
                isDark ? 'text-slate-100' : 'text-slate-800'
              }`}
            >
              “{activeHighlight.line}”
            </p>
          </div>

          <div
            aria-hidden="true"
            className="kc-thought-tail"
            style={{ marginLeft: `${puffOffset}px` }}
          >
            <span className="kc-puff kc-puff-1" />
            <span className="kc-puff kc-puff-2" />
            <span className="kc-puff kc-puff-3" />
          </div>
        </div>
      )}
    </div>
  );
}