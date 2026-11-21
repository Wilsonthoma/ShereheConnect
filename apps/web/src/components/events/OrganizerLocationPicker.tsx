'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui';
import type { GeoCoords, TranslateFn } from '@/lib/eventDetailHelpers';

interface OrganizerLocationPickerProps {
  value: GeoCoords | null;
  venueName?: string;
  onChange: (coords: GeoCoords, suggestedVenueName?: string) => void;
  tr: TranslateFn;
}

const DEFAULT_CENTER: GeoCoords = { lat: -1.2921, lng: 36.8219 };

export default function OrganizerLocationPicker({
  value,
  venueName,
  onChange,
  tr,
}: OrganizerLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [locating, setLocating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const activeCoords = value ?? DEFAULT_CENTER;

  const updatePin = useCallback(
    (coords: GeoCoords, suggestedName?: string) => {
      onChange(coords, suggestedName);
      if (mapRef.current) {
        mapRef.current.setView([coords.lat, coords.lng], 16, {
          animate: true,
        });
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lng]);
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initial = value ?? DEFAULT_CENTER;
    const map = L.map(mapContainerRef.current, {
      center: [initial.lat, initial.lng],
      zoom: value ? 16 : 13,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([initial.lat, initial.lng], {
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange({ lat: pos.lat, lng: pos.lng });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!value || !markerRef.current || !mapRef.current) return;
    const current = markerRef.current.getLatLng();
    if (
      Math.abs(current.lat - value.lat) > 1e-6 ||
      Math.abs(current.lng - value.lng) > 1e-6
    ) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom(), {
        animate: true,
      });
    }
  }, [value]);

  const handleShareCurrentLocation = useCallback(() => {
    setStatusError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatusError(tr('evt.detail.geolocationUnavailable'));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: GeoCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters:
            typeof pos.coords.accuracy === 'number'
              ? Math.round(pos.coords.accuracy)
              : undefined,
        };

        let resolvedName: string | undefined;
        if (!venueName || !venueName.trim()) {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`,
            );
            if (res.ok) {
              const json = (await res.json()) as {
                display_name?: string;
                name?: string;
              };
              resolvedName =
                json.name || json.display_name?.split(',')[0]?.trim();
            }
          } catch {
            // Optional reverse geocode
          }
        }

        updatePin(coords, resolvedName);
        setLocating(false);
      },
      (err) => {
        setStatusError(err.message || tr('evt.detail.geolocationDenied'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [tr, updatePin, venueName]);

  return (
    <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2B2B2B] p-4 space-y-3 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <p className="text-sm font-normal text-slate-900 dark:text-white">
            Share Event Location
          </p>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
            Share your current GPS pin like WhatsApp or click/drag the pin on the map.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          isLoading={locating}
          onClick={handleShareCurrentLocation}
          className="btn-coddy text-xs shrink-0"
        >
          Share Current Location
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-normal">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] px-3 py-2">
          <span className="text-slate-500 dark:text-slate-400 block">
            Pinned Coordinates
          </span>
          <span className="text-slate-900 dark:text-white mt-0.5 block">
            {value
              ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`
              : 'Not pinned yet'}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] px-3 py-2">
          <span className="text-slate-500 dark:text-slate-400 block">
            Map Reference
          </span>
          <span className="text-slate-900 dark:text-white mt-0.5 block">
            {`${activeCoords.lat.toFixed(5)}, ${activeCoords.lng.toFixed(5)}`}
            {typeof value?.accuracyMeters === 'number'
              ? ` (±${value.accuracyMeters} m)`
              : ''}
          </span>
        </div>
      </div>

      {statusError && (
        <p className="text-xs font-normal text-amber-600 dark:text-amber-400">
          {statusError}
        </p>
      )}

      <div
        ref={mapContainerRef}
        className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 z-0"
      />
    </div>
  );
}