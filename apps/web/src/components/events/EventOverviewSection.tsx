'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui';
import {
  calculateDistanceKm,
  extractBackendAmenities,
  parseEventCoords,
  resolveExternalDirectionsUrl,
  type EventDetail,
  type GeoCoords,
  type OverviewTab,
  type TranslateFn,
} from '@/lib/eventDetailHelpers';

const AnimatedRouteMap = dynamic(
  () => import('@/components/events/AnimatedRouteMap'),
  { ssr: false },
);

interface EventOverviewSectionProps {
  event: EventDetail;
  activeTab: OverviewTab;
  onSelectTab: (tab: OverviewTab) => void;
  tr: TranslateFn;
  formatDateTime: (iso?: string | null) => string;
}

export default function EventOverviewSection({
  event,
  activeTab,
  onSelectTab,
  tr,
  formatDateTime,
}: EventOverviewSectionProps) {
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<GeoCoords | null>(null);
  const [geocodedCoords, setGeocodedCoords] = useState<GeoCoords | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const amenities = useMemo(() => extractBackendAmenities(event), [event]);

  const locationSummary = useMemo(
    () =>
      [event.venueName, event.address, event.county]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(', '),
    [event.venueName, event.address, event.county],
  );

  const explicitCoords = useMemo(() => parseEventCoords(event), [event]);
  const venueCoords = explicitCoords ?? geocodedCoords;

  const distanceKm = useMemo(() => {
    if (!userCoords || !venueCoords) return null;
    return calculateDistanceKm(userCoords, venueCoords);
  }, [userCoords, venueCoords]);

  const formattedDistance = useMemo(() => {
    if (distanceKm === null) return null;
    if (distanceKm < 1) {
      return tr('evt.detail.distanceMeters', {
        distance: Math.round(distanceKm * 1000),
      });
    }
    return tr('evt.detail.distanceKm', {
      distance: distanceKm.toFixed(2),
    });
  }, [distanceKm, tr]);

  const externalDirectionsUrl = useMemo(
    () =>
      resolveExternalDirectionsUrl(
        event,
        venueCoords,
        userCoords,
        locationSummary,
      ),
    [event, venueCoords, userCoords, locationSummary],
  );

  const organizerName =
    event.organizer?.businessName || event.organizer?.name || '';

  const organizerFields = useMemo(() => {
    const org = event.organizer;
    if (!org) return [];
    const rows: Array<{ label: string; value: string; href?: string }> = [];
    if (org.county) rows.push({ label: tr('evt.detail.county'), value: org.county });
    if (org.email) rows.push({ label: tr('evt.detail.email'), value: org.email });
    if (org.phone) rows.push({ label: tr('evt.detail.phone'), value: org.phone });
    if (org.website) {
      const normalizedUrl = org.website.startsWith('http')
        ? org.website
        : `https://${org.website}`;
      rows.push({
        label: tr('evt.detail.website'),
        value: org.website,
        href: normalizedUrl,
      });
    }
    return rows;
  }, [event.organizer, tr]);

  const stopWatchingLocation = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== 'undefined' &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopWatchingLocation();
  }, [stopWatchingLocation]);

  const resolveVenueCoordinates = useCallback(async (): Promise<GeoCoords | null> => {
    if (explicitCoords) return explicitCoords;
    if (geocodedCoords) return geocodedCoords;
    if (!locationSummary) return null;

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          locationSummary,
        )}`,
      );
      if (!geoRes.ok) return null;
      const results = (await geoRes.json()) as Array<{
        lat?: string;
        lon?: string;
      }>;
      const first = results?.[0];
      if (!first?.lat || !first?.lon) return null;
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      const resolved = { lat, lng };
      setGeocodedCoords(resolved);
      return resolved;
    } catch {
      return null;
    }
  }, [explicitCoords, geocodedCoords, locationSummary]);

  const requestUserLocationAndTrack = useCallback(async () => {
    setIsMapOpen(true);
    setLocationError(null);
    void resolveVenueCoordinates();

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError(tr('evt.detail.geolocationUnavailable'));
      return;
    }

    stopWatchingLocation();
    setLocating(true);

    const handlePosition = (pos: GeolocationPosition) => {
      setUserCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyMeters:
          typeof pos.coords.accuracy === 'number'
            ? Math.round(pos.coords.accuracy)
            : undefined,
      });
      setLocationError(null);
      setLocating(false);
    };

    const handleError = (err: GeolocationPositionError) => {
      setLocationError(err.message || tr('evt.detail.geolocationDenied'));
      setLocating(false);
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handleError,
      geoOptions,
    );
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      geoOptions,
    );
  }, [resolveVenueCoordinates, stopWatchingLocation, tr]);

  async function handleCopyLocation() {
    if (!locationSummary || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(locationSummary);
      setCopiedLocation(true);
      setTimeout(() => setCopiedLocation(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  }

  const tabs: Array<{
    id: OverviewTab;
    label: string;
    badgeCount?: number;
  }> = [
    { id: 'OVERVIEW', label: tr('evt.detail.aboutEvent') },
    {
      id: 'AMENITIES',
      label: tr('evt.detail.amenities'),
      badgeCount: amenities.length,
    },
    { id: 'VENUE', label: tr('evt.detail.venueAndMap') },
    { id: 'ORGANIZER', label: tr('evt.detail.organizerTab') },
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 sm:p-6 space-y-5 text-left">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-700 pb-3.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={isActive ? 'secondary' : 'ghost'}
              size="md"
              onClick={() => onSelectTab(tab.id)}
              className={`w-full justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm ${
                isActive
                  ? 'bg-[#E0F2FE] dark:bg-[#29ABE2]/20 text-[#1A8CC4] dark:text-[#29ABE2]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                <span className="rounded-full bg-slate-200/80 dark:bg-[#2B2B2B] px-2 py-0.5 text-xs shrink-0">
                  {tab.badgeCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-3">
          <h1 className="heading-display text-2xl sm:text-3xl text-slate-900 dark:text-white">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-sm font-normal leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
              {event.description}
            </p>
          )}
        </div>
      )}

      {activeTab === 'AMENITIES' && (
        <div className="space-y-3">
          <h2
            data-subheading="true"
            className="subheading text-base sm:text-lg text-slate-900 dark:text-white"
          >
            {tr('evt.detail.amenities')}
          </h2>

          {amenities.length === 0 ? (
            <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
              {tr('evt.detail.noAmenities')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2B2B2B] px-4 py-3 text-sm font-normal text-slate-800 dark:text-slate-100"
                >
                  {amenity}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'VENUE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2
              data-subheading="true"
              className="subheading text-base sm:text-lg text-slate-900 dark:text-white"
            >
              {tr('evt.detail.venueAndMap')}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {locationSummary && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopyLocation()}
                  className="text-xs sm:text-sm"
                >
                  {copiedLocation
                    ? tr('common.copied')
                    : tr('evt.detail.copyLocation')}
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={locating}
                onClick={() => void requestUserLocationAndTrack()}
                className="btn-coddy text-xs sm:text-sm"
              >
                {tr('evt.detail.getDirections')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2B2B2B] p-4 text-sm font-normal">
            {event.venueName && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('evt.detail.venueName')}
                </p>
                <p className="text-slate-900 dark:text-white mt-0.5">
                  {event.venueName}
                </p>
              </div>
            )}
            {event.county && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('evt.detail.county')}
                </p>
                <p className="text-slate-900 dark:text-white mt-0.5">
                  {event.county}
                </p>
              </div>
            )}
            {event.address && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('evt.detail.addressLabel')}
                </p>
                <p className="text-slate-900 dark:text-white mt-0.5">
                  {event.address}
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tr('evt.detail.scheduleLabel')}
              </p>
              <p className="text-slate-900 dark:text-white mt-0.5">
                {tr('evt.detail.starts', {
                  date: formatDateTime(event.startsAt),
                })}
                {event.endsAt
                  ? ` / ${tr('evt.detail.ends', {
                      date: formatDateTime(event.endsAt),
                    })}`
                  : ''}
              </p>
            </div>
            {formattedDistance && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('evt.detail.distanceLabel')}
                </p>
                <p className="text-[#1A8CC4] dark:text-[#29ABE2] mt-0.5">
                  {formattedDistance}
                </p>
              </div>
            )}
          </div>

          {isMapOpen && (
            <div className="space-y-2.5">
              {locationError && (
                <p className="text-xs font-normal text-amber-600 dark:text-amber-400">
                  {locationError}
                </p>
              )}
              <AnimatedRouteMap
                origin={userCoords}
                destination={venueCoords}
                venueLabel={event.venueName || locationSummary}
                locating={locating}
                onRefreshLocation={() => void requestUserLocationAndTrack()}
                onClose={() => {
                  stopWatchingLocation();
                  setIsMapOpen(false);
                }}
                externalDirectionsUrl={externalDirectionsUrl}
                tr={tr}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'ORGANIZER' && (
        <div className="space-y-4">
          <h2
            data-subheading="true"
            className="subheading text-base sm:text-lg text-slate-900 dark:text-white"
          >
            {tr('evt.detail.organizerInfo')}
          </h2>

          {!event.organizer && !organizerName ? (
            <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
              {tr('evt.detail.noOrganizerInfo')}
            </p>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2B2B2B] p-4 space-y-3 text-sm font-normal">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base text-slate-900 dark:text-white">
                  {organizerName}
                </p>
                {event.organizer?.verified && (
                  <span className="inline-flex items-center rounded-full bg-[#E0F2FE] dark:bg-[#29ABE2]/20 px-2.5 py-0.5 text-xs text-[#1A8CC4] dark:text-[#29ABE2]">
                    {tr('common.verified')}
                  </span>
                )}
              </div>

              {event.organizer?.bio && (
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-3">
                  {event.organizer.bio}
                </p>
              )}

              {organizerFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-700 pt-3 text-xs">
                  {organizerFields.map((field) => (
                    <div key={field.label}>
                      <span className="text-slate-500 dark:text-slate-400 block">
                        {field.label}
                      </span>
                      {field.href ? (
                        <a
                          href={field.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1A8CC4] dark:text-[#29ABE2] underline break-all"
                        >
                          {field.value}
                        </a>
                      ) : (
                        <span className="text-slate-900 dark:text-white break-all">
                          {field.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}