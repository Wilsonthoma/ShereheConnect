'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui';
import {
  calculateDistanceKm,
  type GeoCoords,
  type TranslateFn,
} from '@/lib/eventDetailHelpers';

interface AnimatedRouteMapProps {
  origin: GeoCoords | null;
  destination: GeoCoords | null;
  venueLabel: string;
  locating: boolean;
  onRefreshLocation: () => void;
  onClose: () => void;
  externalDirectionsUrl: string | null;
  tr: TranslateFn;
}

interface RouteSummary {
  coords: Array<[number, number]>;
  distanceKm: number;
  durationMinutes: number;
}

const CAR_ICON = L.divIcon({
  className: 'event-car-marker',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#29ABE2;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function AnimatedRouteMap({
  origin,
  destination,
  venueLabel,
  locating,
  onRefreshLocation,
  onClose,
  externalDirectionsUrl,
  tr,
}: AnimatedRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const originMarkerRef = useRef<L.CircleMarker | null>(null);
  const destMarkerRef = useRef<L.CircleMarker | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const straightLineKm = useMemo(() => {
    if (!origin || !destination) return null;
    return calculateDistanceKm(origin, destination);
  }, [origin, destination]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = destination ??
      origin ?? { lat: -1.2921, lng: 36.8219 };

    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: 14,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    routeLayerRef.current = L.polyline([], {
      color: '#29ABE2',
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    originMarkerRef.current = L.circleMarker([initialCenter.lat, initialCenter.lng], {
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#0F172A',
      fillOpacity: 1,
    });

    destMarkerRef.current = L.circleMarker([initialCenter.lat, initialCenter.lng], {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#1A8CC4',
      fillOpacity: 1,
    }).addTo(map);

    carMarkerRef.current = L.marker([initialCenter.lat, initialCenter.lng], {
      icon: CAR_ICON,
    });

    mapRef.current = map;

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      carMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchRoadRoute() {
      if (!origin || !destination) {
        setRoute(null);
        return;
      }

      setLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Route fetch failed');
        const data = (await res.json()) as {
          routes?: Array<{
            distance?: number;
            duration?: number;
            geometry?: { coordinates?: Array<[number, number]> };
          }>;
        };
        const primary = data.routes?.[0];
        const rawCoords = primary?.geometry?.coordinates;

        if (active && rawCoords && rawCoords.length > 1) {
          const latLngs: Array<[number, number]> = rawCoords.map(
            ([lng, lat]) => [lat, lng],
          );
          setRoute({
            coords: latLngs,
            distanceKm:
              typeof primary.distance === 'number'
                ? primary.distance / 1000
                : calculateDistanceKm(origin, destination),
            durationMinutes:
              typeof primary.duration === 'number'
                ? Math.max(1, Math.round(primary.duration / 60))
                : 1,
          });
          setProgress(0);
          setIsPlaying(true);
          return;
        }
      } catch {
        // Fallback to direct line if routing service is unreachable
      } finally {
        if (active) setLoadingRoute(false);
      }

      if (active) {
        const directKm = calculateDistanceKm(origin, destination);
        setRoute({
          coords: [
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ],
          distanceKm: directKm,
          durationMinutes: Math.max(1, Math.round((directKm / 35) * 60)),
        });
        setProgress(0);
        setIsPlaying(true);
      }
    }

    void fetchRoadRoute();
    return () => {
      active = false;
    };
  }, [origin, destination]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (destination && destMarkerRef.current) {
      destMarkerRef.current.setLatLng([destination.lat, destination.lng]);
      destMarkerRef.current.bindPopup(venueLabel || tr('evt.detail.venueName'));
    }

    if (origin && originMarkerRef.current) {
      originMarkerRef.current
        .setLatLng([origin.lat, origin.lng])
        .addTo(map);
    }

    if (route && route.coords.length > 0 && routeLayerRef.current) {
      routeLayerRef.current.setLatLngs(route.coords);
      map.fitBounds(L.latLngBounds(route.coords), { padding: [32, 32] });
      if (carMarkerRef.current) {
        carMarkerRef.current.setLatLng(route.coords[0]).addTo(map);
      }
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 15);
    }
  }, [destination, origin, route, tr, venueLabel]);

  useEffect(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (!isPlaying || !route || route.coords.length < 2) return;

    const totalPoints = route.coords.length - 1;
    const durationMs = 6000;
    const startTime = performance.now() - progress * durationMs;

    const step = (now: number) => {
      const elapsed = (now - startTime) % durationMs;
      const nextProgress = elapsed / durationMs;
      setProgress(nextProgress);

      const exactIndex = nextProgress * totalPoints;
      const idx = Math.min(totalPoints - 1, Math.floor(exactIndex));
      const frac = exactIndex - idx;
      const [lat1, lng1] = route.coords[idx];
      const [lat2, lng2] = route.coords[idx + 1];

      const interpLat = lat1 + (lat2 - lat1) * frac;
      const interpLng = lng1 + (lng2 - lng1) * frac;

      carMarkerRef.current?.setLatLng([interpLat, interpLng]);
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, route]);

  const handleReplay = useCallback(() => {
    setProgress(0);
    if (route?.coords[0] && carMarkerRef.current) {
      carMarkerRef.current.setLatLng(route.coords[0]);
    }
    setIsPlaying(true);
  }, [route]);

  const activeDistanceKm = route?.distanceKm ?? straightLineKm;

  return (
    <div className="rounded-xl border border-[#29ABE2]/50 bg-slate-50 dark:bg-[#2B2B2B] p-4 space-y-3.5 text-left">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <h3
          data-subheading="true"
          className="subheading text-sm sm:text-base text-slate-900 dark:text-white"
        >
          {tr('evt.detail.distanceTrackerTitle')}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-xs"
        >
          {tr('common.close')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-normal">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-3">
          <span className="text-slate-500 dark:text-slate-400 block">
            {tr('evt.detail.currentLocationLabel')}
          </span>
          <span className="text-slate-900 dark:text-white mt-0.5 block">
            {locating
              ? tr('evt.detail.locatingUser')
              : origin
                ? `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}`
                : tr('evt.detail.locationPending')}
          </span>
          {typeof origin?.accuracyMeters === 'number' && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {tr('evt.detail.accuracyMeters', {
                meters: origin.accuracyMeters,
              })}
            </span>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-3">
          <span className="text-slate-500 dark:text-slate-400 block">
            {tr('evt.detail.distanceLabel')}
          </span>
          <span className="text-sm text-[#1A8CC4] dark:text-[#29ABE2] mt-0.5 block">
            {loadingRoute
              ? tr('evt.detail.locatingUser')
              : activeDistanceKm !== null
                ? activeDistanceKm < 1
                  ? tr('evt.detail.distanceMeters', {
                      distance: Math.round(activeDistanceKm * 1000),
                    })
                  : tr('evt.detail.distanceKm', {
                      distance: activeDistanceKm.toFixed(2),
                    })
                : tr('evt.detail.distanceUnavailable')}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-3">
          <span className="text-slate-500 dark:text-slate-400 block">
            Estimated Drive
          </span>
          <span className="text-sm text-slate-900 dark:text-white mt-0.5 block">
            {route ? `${route.durationMinutes} min` : 'Pending route'}
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 z-0"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {route && route.coords.length >= 2 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying((prev) => !prev)}
                className="text-xs"
              >
                {isPlaying ? 'Pause Route' : 'Play Route'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReplay}
                className="text-xs"
              >
                Replay Car
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={locating}
            onClick={onRefreshLocation}
            className="text-xs"
          >
            {tr('evt.detail.refreshLocation')}
          </Button>
        </div>

        {externalDirectionsUrl && (
          <a
            href={externalDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-[#29ABE2] hover:bg-[#1A8CC4] text-white px-3.5 py-2 text-xs font-normal transition-colors"
          >
            {tr('evt.detail.openExternalMap')}
          </a>
        )}
      </div>
    </div>
  );
}