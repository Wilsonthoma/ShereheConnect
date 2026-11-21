import type { GroupCategory, GroupPricingMode } from '@/lib/eventsApi';

export interface OrganizerInfo {
  id?: string;
  businessName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  county?: string | null;
  bio?: string | null;
  website?: string | null;
  verified?: boolean;
}

export interface EventTicketTier {
  id: string;
  name: string;
  description?: string | null;
  priceKes: number;
  quantityTotal: number;
  quantitySold: number;
  quantityReserved: number;
  isGroupSubgroup?: boolean;
  groupCategory?: GroupCategory | string | null;
  occupantsPerUnit?: number;
  pricingMode?: GroupPricingMode | string;
  isActive?: boolean;
  salesStartAt?: string | null;
  salesEndAt?: string | null;
}

export interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  venueName?: string | null;
  address?: string | null;
  county?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  directionsUrl?: string | null;
  startsAt: string;
  endsAt?: string | null;
  coverImageUrl?: string | null;
  status?: string;
  maxAttendees?: number | null;
  totalTicketsAvailable?: number | null;
  allowGroupBookings?: boolean;
  amenities?: unknown[] | null;
  eventAmenities?: unknown[] | null;
  features?: unknown[] | null;
  facilities?: unknown[] | null;
  ticketTiers?: EventTicketTier[];
  organizer?: OrganizerInfo | null;
}

export interface SubgroupOption {
  key: string;
  label: string;
  tierId: string;
  category?: string | null;
  occupantsPerUnit: number;
  pricingMode: GroupPricingMode;
  priceKes: number;
  availableCount: number;
  isActive: boolean;
}

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

export type AttendanceMode = 'INDIVIDUAL' | 'GROUP';
export type OverviewTab = 'OVERVIEW' | 'AMENITIES' | 'VENUE' | 'ORGANIZER';

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export const ACTIVE_BOOKING_STATUSES = new Set([
  'PENDING',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CHECKED_IN',
]);

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'http://localhost:3001';

const FALLBACK_LABELS: Record<string, { en: string; sw: string }> = {
  'evt.detail.aboutEvent': { en: 'Event Overview', sw: 'Muhtasari wa Tukio' },
  'evt.detail.amenities': { en: 'Amenities', sw: 'Huduma na Vifaa' },
  'evt.detail.noAmenities': {
    en: 'No amenities listed.',
    sw: 'Hakuna huduma zilizoorodheshwa.',
  },
  'evt.detail.venueAndMap': { en: 'Venue & Map', sw: 'Ukumbi na Ramani' },
  'evt.detail.venueName': { en: 'Venue', sw: 'Ukumbi' },
  'evt.detail.county': { en: 'County', sw: 'Kaunti' },
  'evt.detail.addressLabel': { en: 'Address', sw: 'Anwani' },
  'evt.detail.scheduleLabel': { en: 'Schedule', sw: 'Ratiba' },
  'evt.detail.copyLocation': { en: 'Copy Location', sw: 'Nakili Mahali' },
  'common.copied': { en: 'Copied', sw: 'Imenakiliwa' },
  'common.close': { en: 'Close', sw: 'Funga' },
  'evt.detail.getDirections': { en: 'Get Directions', sw: 'Pata Maelekezo' },
  'evt.detail.distanceTrackerTitle': {
    en: 'Live Distance From Your Location',
    sw: 'Umbali Halisi Kutoka Mahali Ulipo',
  },
  'evt.detail.currentLocationLabel': {
    en: 'Current Location',
    sw: 'Mahali Ulipo Sasa',
  },
  'evt.detail.venueCoordsLabel': {
    en: 'Venue Coordinates',
    sw: 'Majira ya Ukumbi',
  },
  'evt.detail.locatingUser': { en: 'Locating...', sw: 'Inatafuta mahali...' },
  'evt.detail.locationPending': {
    en: 'Location unavailable',
    sw: 'Mahali hakujapatikana',
  },
  'evt.detail.distanceLabel': {
    en: 'Distance to Venue',
    sw: 'Umbali Hadi Ukumbini',
  },
  'evt.detail.distanceKm': { en: '{distance} km', sw: 'km {distance}' },
  'evt.detail.distanceMeters': { en: '{distance} m', sw: 'm {distance}' },
  'evt.detail.accuracyMeters': {
    en: 'GPS accuracy: ±{meters} m',
    sw: 'Usahihi wa GPS: ±m {meters}',
  },
  'evt.detail.distanceUnavailable': {
    en: 'Enable location to calculate',
    sw: 'Washa mahali ili kukokotoa',
  },
  'evt.detail.refreshLocation': {
    en: 'Recalculate Distance',
    sw: 'Kokotoa Tena Umbali',
  },
  'evt.detail.openExternalMap': { en: 'Open Map App', sw: 'Fungua Ramani' },
  'evt.detail.geolocationUnavailable': {
    en: 'Geolocation is not supported in this browser.',
    sw: 'Kivinjari hakiungi mkono huduma ya mahali.',
  },
  'evt.detail.geolocationDenied': {
    en: 'Location access was not granted.',
    sw: 'Ruhusa ya mahali haikutolewa.',
  },
  'evt.detail.organizerTab': { en: 'Organizer', sw: 'Mwandalizi' },
  'evt.detail.organizerInfo': {
    en: 'Organizer Details',
    sw: 'Maelezo ya Mwandalizi',
  },
  'evt.detail.noOrganizerInfo': {
    en: 'Organizer details unavailable.',
    sw: 'Maelezo ya mwandalizi hayapatikani.',
  },
  'common.verified': { en: 'Verified', sw: 'Imethibitishwa' },
  'evt.detail.email': { en: 'Email', sw: 'Barua Pepe' },
  'evt.detail.phone': { en: 'Phone', sw: 'Simu' },
  'evt.detail.website': { en: 'Website', sw: 'Tovuti' },
  'evt.detail.selectHelper': {
    en: 'Toggle Individual or Group attendance, pick one subgroup when in Group mode, and set quantity.',
    sw: 'Chagua kuhudhuria Binafsi au Kikundi, chagua kundi moja ukiwa kwenye Kikundi, kisha weka idadi.',
  },
  'evt.detail.existingBookingNotice': {
    en: 'Active booking exists ({ref}) for this event.',
    sw: 'Tayari una nafasi hai ({ref}) kwa tukio hili.',
  },
  'evt.detail.oneBookingPerEvent': {
    en: 'Only one active booking is allowed per event.',
    sw: 'Nafasi moja tu hai inaruhusiwa kwa kila tukio.',
  },
  'evt.detail.viewTickets': { en: 'View Tickets', sw: 'Angalia Tiketi' },
  'evt.detail.attendanceModeLabel': {
    en: 'Attendance Mode',
    sw: 'Aina ya Mahudhurio',
  },
  'evt.detail.modeIndividual': {
    en: 'Individual ({count})',
    sw: 'Binafsi ({count})',
  },
  'evt.detail.modeGroup': { en: 'Group ({count})', sw: 'Kikundi ({count})' },
  'evt.detail.selectSubgroup': { en: 'Select Subgroup', sw: 'Chagua Kundi' },
  'evt.detail.groupPackageLabel': {
    en: 'Group Package',
    sw: 'Kifurushi cha Kikundi',
  },
  'evt.detail.individualPackageLabel': {
    en: 'Individual Tickets',
    sw: 'Tiketi za Binafsi',
  },
  'evt.detail.emptySelection': {
    en: 'No packages available for this selection.',
    sw: 'Hakuna vifurushi vinavyopatikana kwa chaguo hili.',
  },
  'evt.detail.switchToGroup': { en: 'Switch to Group', sw: 'Badili kwenda Kikundi' },
  'evt.detail.alreadyBooked': {
    en: 'Already Booked',
    sw: 'Tayari Umeweka Nafasi',
  },
  'evt.detail.reserveTickets': { en: 'Reserve Tickets', sw: 'Weka Tiketi' },
  'evt.detail.duplicateBookingError': {
    en: 'You already have an active booking for this event.',
    sw: 'Tayari una nafasi hai kwa tukio hili.',
  },
};

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function resolveLabel(
  t: TranslateFn,
  isSw: boolean,
  key: string,
  params?: Record<string, string | number>,
): string {
  const raw = t(key, params);
  if (raw && raw !== key) return raw;
  const entry = FALLBACK_LABELS[key];
  if (!entry) return params ? interpolate(key, params) : key;
  return interpolate(isSw ? entry.sw : entry.en, params);
}

export function getAvailableCount(tier: EventTicketTier): number {
  return Math.max(
    0,
    tier.quantityTotal - tier.quantitySold - tier.quantityReserved,
  );
}

export function getOccupantsPerUnit(tier: EventTicketTier): number {
  if (typeof tier.occupantsPerUnit === 'number' && tier.occupantsPerUnit > 0) {
    return tier.occupantsPerUnit;
  }
  if (tier.groupCategory === 'COUPLE') return 2;
  if (tier.groupCategory === 'TABLE') return 6;
  return 1;
}

export function getEffectivePricingMode(tier: EventTicketTier): GroupPricingMode {
  return tier.pricingMode === 'PER_OCCUPANT' ? 'PER_OCCUPANT' : 'BUNDLE_FIXED';
}

export function calculateTierSubtotalKes(
  tier: EventTicketTier,
  quantity: number,
): number {
  const safeQty = Math.max(1, quantity);
  const mode = getEffectivePricingMode(tier);
  const occupants = getOccupantsPerUnit(tier);
  if (tier.isGroupSubgroup && mode === 'PER_OCCUPANT') {
    return tier.priceKes * occupants * safeQty;
  }
  return tier.priceKes * safeQty;
}

export function pickInitialTierId(list: EventTicketTier[]): string {
  const firstAvailable =
    list.find((item) => item.isActive !== false && getAvailableCount(item) > 0) ??
    list[0];
  return firstAvailable ? firstAvailable.id : '';
}

export function isDuplicateBookingError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already booked') ||
    normalized.includes('duplicate') ||
    normalized.includes('active booking') ||
    normalized.includes('one booking per event') ||
    normalized.includes('already have a booking')
  );
}

export function extractBackendAmenities(event: EventDetail): string[] {
  const rawList =
    event.amenities ??
    event.eventAmenities ??
    event.features ??
    event.facilities ??
    [];
  if (!Array.isArray(rawList)) return [];

  const parsed = rawList
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item !== null) {
        const record = item as Record<string, unknown>;
        for (const key of ['name', 'label', 'title', 'amenity']) {
          if (typeof record[key] === 'string' && record[key].trim()) {
            return record[key].trim();
          }
        }
      }
      return '';
    })
    .filter(Boolean);

  return Array.from(new Set(parsed));
}

export function parseEventCoords(event: EventDetail): GeoCoords | null {
  if (
    event.latitude === undefined ||
    event.latitude === null ||
    event.longitude === undefined ||
    event.longitude === null
  ) {
    return null;
  }
  const lat = Number(event.latitude);
  const lng = Number(event.longitude);
  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }
  return { lat, lng };
}

export function calculateDistanceKm(from: GeoCoords, to: GeoCoords): number {
  const earthRadiusKm = 6371.0088;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusKm * centralAngle;
}

export function resolveExternalDirectionsUrl(
  event: EventDetail,
  destinationCoords: GeoCoords | null,
  originCoords: GeoCoords | null,
  locationSummary: string,
): string | null {
  if (event.directionsUrl && event.directionsUrl.trim()) {
    return event.directionsUrl.trim();
  }

  const destParam = destinationCoords
    ? `${destinationCoords.lat},${destinationCoords.lng}`
    : locationSummary;
  if (!destParam) return null;

  const originParam = originCoords
    ? `&origin=${encodeURIComponent(`${originCoords.lat},${originCoords.lng}`)}`
    : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destParam,
  )}${originParam}`;
}

export function formatOccupantCount(count: number, tr: TranslateFn): string {
  return `${count} ${
    count === 1
      ? tr('common.occupant.singular')
      : tr('common.occupant.plural')
  }`;
}