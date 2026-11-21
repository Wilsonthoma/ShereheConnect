'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import { organizerEventsApi, TicketTier } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { Button, ImageUploader, FullPageLoader } from '@/components/ui';
import { KENYA_COUNTIES, lookupCounty } from '@/lib/kenya-counties';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  resolveLabel,
  type GeoCoords,
  type TranslateFn,
} from '@/lib/eventDetailHelpers';

const OrganizerLocationPicker = dynamic(
  () => import('@/components/events/OrganizerLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 animate-pulse" />
    ),
  },
);

const CATEGORIES = [
  'FESTIVAL',
  'CONFERENCE',
  'ENTERTAINMENT',
  'SPORTS',
  'ARTS',
  'COMMUNITY',
  'EDUCATION',
  'BUSINESS',
];

const FEATURE_OPTIONS = [
  { id: 'general', label: 'General Admission' },
  { id: 'standard', label: 'Standard Entry' },
  { id: 'vip', label: 'VIP Access' },
  { id: 'wifi', label: 'Free Wi-Fi' },
  { id: 'parking', label: 'Parking Available' },
  { id: 'drinks', label: 'Drinks Included' },
  { id: 'food', label: 'Food Available' },
];

const GROUP_CATEGORIES = ['FAMILY', 'COUPLE', 'FRIENDS', 'TABLE'] as const;

type EditableTier = TicketTier & {
  isGroupSubgroup?: boolean;
  groupCategory?: string;
  occupantsPerUnit?: number;
  pricingMode?: 'PER_OCCUPANT' | 'BUNDLE_FIXED';
};

interface EventDetailResponse {
  title?: string;
  description?: string;
  category?: { code?: string | null } | null;
  coverImageUrl?: string | null;
  venueName?: string;
  address?: string;
  county?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  startsAt: string;
  endsAt: string;
  maxAttendees?: number | null;
  totalTicketsAvailable?: number | null;
  allowGroupBookings?: boolean;
  isFeatured?: boolean;
  eventFeatures?: string[];
  ticketTiers?: Array<{
    id?: string;
    name: string;
    priceKes: number;
    quantityTotal: number;
    isGroupSubgroup?: boolean;
    groupCategory?: string | null;
    occupantsPerUnit?: number | null;
    pricingMode?: 'PER_OCCUPANT' | 'BUNDLE_FIXED' | null;
    quantitySold?: number;
    quantityReserved?: number;
    sortOrder?: number;
    isActive?: boolean;
  }>;
}

function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { t, language } = useLanguage();
  const isSw = language === 'sw';

  const tr = useCallback<TranslateFn>(
    (key, interpParams) => resolveLabel(t, isSw, key, interpParams),
    [t, isSw],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [pinnedCoords, setPinnedCoords] = useState<GeoCoords | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: 'FESTIVAL',
    coverImageUrl: '',
    venueName: '',
    address: '',
    county: 'Nairobi',
    startsAt: '',
    endsAt: '',
    maxAttendees: '',
    totalTicketsAvailable: '',
    allowGroupBookings: false,
    isFeatured: false,
    eventFeatures: [] as string[],
    ticketTiers: [
      {
        name: 'Regular',
        priceKes: 0,
        quantityTotal: 100,
        isGroupSubgroup: false,
        groupCategory: 'FRIENDS',
        occupantsPerUnit: 1,
        pricingMode: 'PER_OCCUPANT',
      },
    ] as EditableTier[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const token = getToken();
      if (!token || !id) {
        setLoading(false);
        return;
      }
      try {
        const event = (await organizerEventsApi.detail(
          token,
          id,
        )) as EventDetailResponse;

        const latNum =
          event.latitude !== undefined && event.latitude !== null
            ? Number(event.latitude)
            : NaN;
        const lngNum =
          event.longitude !== undefined && event.longitude !== null
            ? Number(event.longitude)
            : NaN;
        if (
          !Number.isNaN(latNum) &&
          !Number.isNaN(lngNum) &&
          Math.abs(latNum) <= 90 &&
          Math.abs(lngNum) <= 180
        ) {
          setPinnedCoords({ lat: latNum, lng: lngNum });
        }

        setForm({
          title: event.title ?? '',
          description: event.description ?? '',
          categoryId: event.category?.code ?? 'FESTIVAL',
          coverImageUrl: event.coverImageUrl ?? '',
          venueName: event.venueName ?? '',
          address: event.address ?? '',
          county: event.county ?? 'Nairobi',
          startsAt: toLocalInput(event.startsAt),
          endsAt: toLocalInput(event.endsAt),
          maxAttendees: event.maxAttendees ? String(event.maxAttendees) : '',
          totalTicketsAvailable: event.totalTicketsAvailable
            ? String(event.totalTicketsAvailable)
            : '',
          allowGroupBookings: Boolean(event.allowGroupBookings),
          isFeatured: Boolean(event.isFeatured),
          eventFeatures: event.eventFeatures ?? [],
          ticketTiers: event.ticketTiers?.length
            ? event.ticketTiers.map((t) => ({
                id: t.id,
                name: t.name,
                priceKes: t.priceKes,
                quantityTotal: t.quantityTotal,
                isGroupSubgroup: Boolean(t.isGroupSubgroup),
                groupCategory: t.groupCategory || 'FRIENDS',
                occupantsPerUnit: Math.max(1, Number(t.occupantsPerUnit || 1)),
                pricingMode:
                  t.pricingMode ||
                  (t.isGroupSubgroup ? 'BUNDLE_FIXED' : 'PER_OCCUPANT'),
                quantitySold: t.quantitySold ?? 0,
                quantityReserved: t.quantityReserved ?? 0,
                sortOrder: t.sortOrder ?? 0,
                isActive: t.isActive ?? true,
              }))
            : [
                {
                  name: 'Regular',
                  priceKes: 0,
                  quantityTotal: 100,
                  isGroupSubgroup: false,
                  groupCategory: 'FRIENDS',
                  occupantsPerUnit: 1,
                  pricingMode: 'PER_OCCUPANT',
                },
              ],
        });
      } catch (err: unknown) {
        toast.error(
          'Failed to load event',
          err instanceof Error ? err.message : undefined,
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const updateForm = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleLocationChange = useCallback(
    (coords: GeoCoords, suggestedVenueName?: string) => {
      setPinnedCoords(coords);
      setErrors((prev) => ({ ...prev, location: '' }));
      if (suggestedVenueName && !form.venueName.trim()) {
        setForm((prev) => ({ ...prev, venueName: suggestedVenueName }));
      }
    },
    [form.venueName],
  );

  const toggleFeature = (featId: string) =>
    setForm((prev) => ({
      ...prev,
      eventFeatures: prev.eventFeatures.includes(featId)
        ? prev.eventFeatures.filter((f) => f !== featId)
        : [...prev.eventFeatures, featId],
    }));

  const updateTier = <K extends keyof EditableTier>(
    index: number,
    field: K,
    value: EditableTier[K],
  ) =>
    setForm((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((t, i) =>
        i === index ? { ...t, [field]: value } : t,
      ),
    }));

  const handleToggleGroupBookings = (enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      allowGroupBookings: enabled,
      ticketTiers: enabled
        ? prev.ticketTiers
        : prev.ticketTiers.map((t) =>
            t.isGroupSubgroup
              ? {
                  ...t,
                  isGroupSubgroup: false,
                  occupantsPerUnit: 1,
                  pricingMode: 'PER_OCCUPANT',
                }
              : t,
          ),
    }));
  };

  const addGroupCategoryTier = (category: string) => {
    const defaultOccupants =
      category === 'COUPLE' ? 2 : category === 'TABLE' ? 6 : 4;
    const formattedLabel =
      category.charAt(0) + category.slice(1).toLowerCase();

    setForm((prev) => ({
      ...prev,
      allowGroupBookings: true,
      ticketTiers: [
        ...prev.ticketTiers,
        {
          name: `${formattedLabel} Package`,
          priceKes: 0,
          quantityTotal: 10,
          isGroupSubgroup: true,
          groupCategory: category,
          occupantsPerUnit: defaultOccupants,
          pricingMode: 'BUNDLE_FIXED',
        },
      ],
    }));
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.title.trim()) e.title = 'Required';
      if (!form.description.trim()) e.description = 'Required';
      if (!form.coverImageUrl) e.coverImageUrl = 'Required';
    }
    if (s === 2) {
      if (!form.venueName.trim()) e.venueName = 'Required';
      if (!form.address.trim()) e.address = 'Required';
      if (!form.startsAt) e.startsAt = 'Required';
      if (!form.endsAt) e.endsAt = 'Required';
      if (
        form.startsAt &&
        form.endsAt &&
        new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()
      ) {
        e.endsAt = 'End date must be after start date';
      }
    }
    if (s === 3) {
      if (form.ticketTiers.some((t) => !t.name.trim())) {
        e.ticketTiers = 'Required';
      }
      if (form.ticketTiers.some((t) => Number(t.quantityTotal) <= 0)) {
        e.ticketTiers = 'Quantity must be greater than 0';
      }
    }
    return e;
  };

  const handleContinue = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error('Missing details', Object.values(e)[0]);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSave = async () => {
    const step2Errors = validateStep(2);
    const step3Errors = validateStep(3);
    const e = { ...step2Errors, ...step3Errors };
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error('Invalid form', Object.values(e)[0]);
      return;
    }
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const fallbackCoords = lookupCounty(form.county) ?? {
        lat: -1.2921,
        lng: 36.8219,
      };
      const resolvedCoords = pinnedCoords ?? fallbackCoords;

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        coverImageUrl: form.coverImageUrl,
        venueName: form.venueName.trim(),
        address: form.address.trim(),
        county: form.county,
        latitude: Number(resolvedCoords.lat.toFixed(6)),
        longitude: Number(resolvedCoords.lng.toFixed(6)),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        maxAttendees: form.maxAttendees
          ? parseInt(form.maxAttendees, 10)
          : undefined,
        totalTicketsAvailable: form.totalTicketsAvailable
          ? parseInt(form.totalTicketsAvailable, 10)
          : undefined,
        allowGroupBookings: form.allowGroupBookings,
        isFeatured: form.isFeatured,
        eventFeatures: form.eventFeatures,
        ticketTiers: form.ticketTiers.map((t, i) => {
          const isGroup = Boolean(form.allowGroupBookings && t.isGroupSubgroup);
          const occupants = isGroup
            ? Math.max(1, Number(t.occupantsPerUnit || 1))
            : 1;
          const mode = isGroup
            ? t.pricingMode || 'BUNDLE_FIXED'
            : 'PER_OCCUPANT';

          return {
            id: t.id,
            name: t.name.trim(),
            priceKes: Math.max(0, Number(t.priceKes)),
            quantityTotal: Math.max(1, Number(t.quantityTotal)),
            isGroupSubgroup: isGroup,
            groupCategory: isGroup ? t.groupCategory || 'FRIENDS' : null,
            occupantsPerUnit: occupants,
            pricingMode: mode,
            sortOrder: i,
            isActive: true,
          };
        }),
      };

      await organizerEventsApi.update(token, id, payload);
      toast.success('Event updated!', 'Your changes have been saved.');
      router.push(`/organizer/events/${id}`);
    } catch (err: unknown) {
      toast.error(
        'Save failed',
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageLoader message="Loading event..." />;

  const inputCls = (field: string) =>
    `w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-colors border ${
      errors[field]
        ? 'border-red-500'
        : 'border-slate-200 dark:border-slate-700 focus:border-gold'
    }`;

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.push('/organizer/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold px-2 py-1 h-auto"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">
          Edit Event
        </h1>
        <p className="text-sm text-slate-500">Update details for your event.</p>
      </div>

      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s
                  ? 'bg-brand-gradient text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}
            >
              {s}
            </div>
            <span
              className={`text-xs font-semibold ${
                step >= s
                  ? 'text-slate-800 dark:text-slate-100'
                  : 'text-slate-400'
              }`}
            >
              {s === 1
                ? 'Basic Info'
                : s === 2
                  ? 'Venue & Time'
                  : 'Tickets & Extras'}
            </span>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 ${
                  step > s
                    ? 'bg-brand-gradient'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5">
        {step === 1 && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Event Title *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Enter the public name of your event.
              </p>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="e.g., Nairobi Jazz & Food Festival"
                className={inputCls('title')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Category *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Choose the category that matches this event.
              </p>
              <select
                value={form.categoryId}
                onChange={(e) => updateForm('categoryId', e.target.value)}
                className={inputCls('categoryId')}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Cover Image *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Upload a clear banner or poster image.
              </p>
              <ImageUploader
                value={form.coverImageUrl}
                onChange={(url: string) => updateForm('coverImageUrl', url)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Description *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Provide full details about the event and ticket tiers.
              </p>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={4}
                placeholder="Describe your event..."
                className={`${inputCls('description')} resize-none`}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Venue Name *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Enter the venue, grounds, or hall name.
              </p>
              <input
                type="text"
                value={form.venueName}
                onChange={(e) => updateForm('venueName', e.target.value)}
                placeholder="e.g., Uhuru Gardens"
                className={inputCls('venueName')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Address *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Enter street address or directions to the venue.
              </p>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                placeholder="e.g., Lang'ata Road"
                className={inputCls('address')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                County *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Select the Kenyan county where the venue is located.
              </p>
              <select
                value={form.county}
                onChange={(e) => updateForm('county', e.target.value)}
                className={inputCls('county')}
              >
                {KENYA_COUNTIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <OrganizerLocationPicker
              value={pinnedCoords}
              venueName={form.venueName}
              onChange={handleLocationChange}
              tr={tr}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Starts At *
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Start date and time of the event.
                </p>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => updateForm('startsAt', e.target.value)}
                  className={inputCls('startsAt')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Ends At *
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  End date and time of the event.
                </p>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => updateForm('endsAt', e.target.value)}
                  className={inputCls('endsAt')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Max Attendees (Optional)
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Maximum total guests/occupants across all tiers.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.maxAttendees}
                  onChange={(e) =>
                    updateForm(
                      'maxAttendees',
                      e.target.value.replace(/[^0-9]/g, ''),
                    )
                  }
                  placeholder="e.g., 500"
                  className={inputCls('maxAttendees')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Total Tickets Available (Optional)
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Hard cap on total ticket seats released for this event.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.totalTicketsAvailable}
                  onChange={(e) =>
                    updateForm(
                      'totalTicketsAvailable',
                      e.target.value.replace(/[^0-9]/g, ''),
                    )
                  }
                  placeholder="e.g., 500"
                  className={inputCls('totalTicketsAvailable')}
                />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Allow Group Bookings &amp; Subgroups
                  </p>
                  <p className="text-xs text-slate-500">
                    Enable group subgroups (Couple, Friends, Table, Family) with
                    custom per-subgroup prices.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowGroupBookings}
                    onChange={(e) => handleToggleGroupBookings(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold" />
                </label>
              </div>

              {form.allowGroupBookings && (
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Add subgroup packages with custom prices:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {GROUP_CATEGORIES.map((gc) => (
                      <Button
                        key={gc}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addGroupCategoryTier(gc)}
                        className="text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-2.5 py-1 h-auto rounded-lg hover:border-gold"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {gc}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Featured Event
                  </p>
                  <p className="text-xs text-slate-500">
                    Highlight this event to stand out.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => updateForm('isFeatured', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold" />
                </label>
              </div>

              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                  Event Features
                </p>
                <p className="text-[11px] text-slate-400">
                  Select amenities or perks available to attendees.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {FEATURE_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.eventFeatures.includes(opt.id)}
                        onChange={() => toggleFeature(opt.id)}
                        className="w-4 h-4 accent-gold rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    Individual Tiers &amp; Group Subgroups
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set each tier or subgroup&apos;s own KES price (0 for free)
                    and available seats/units.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    updateForm('ticketTiers', [
                      ...form.ticketTiers,
                      {
                        name: '',
                        priceKes: 0,
                        quantityTotal: 50,
                        isGroupSubgroup: false,
                        groupCategory: 'FRIENDS',
                        occupantsPerUnit: 1,
                        pricingMode: 'PER_OCCUPANT',
                      },
                    ])
                  }
                  className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 h-auto rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Tier
                </Button>
              </div>

              {errors.ticketTiers && (
                <p className="text-xs font-semibold text-red-500">
                  {errors.ticketTiers}
                </p>
              )}

              {form.ticketTiers.map((tier, index) => {
                const isGroup = Boolean(
                  form.allowGroupBookings && tier.isGroupSubgroup,
                );
                const mode = tier.pricingMode || 'BUNDLE_FIXED';
                const occupants = Math.max(1, Number(tier.occupantsPerUnit || 1));

                return (
                  <div
                    key={tier.id ?? index}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {isGroup
                          ? `Subgroup ${index + 1} (${tier.groupCategory || 'GROUP'})`
                          : `Individual Tier ${index + 1}`}
                      </span>
                      {form.ticketTiers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateForm(
                              'ticketTiers',
                              form.ticketTiers.filter((_, i) => i !== index),
                            )
                          }
                          aria-label={`Remove ticket tier ${index + 1}`}
                          className="text-red-500 hover:text-red-600 p-1.5 h-auto min-w-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {isGroup ? 'Subgroup Name *' : 'Tier Name *'}
                        </label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) =>
                            updateTier(index, 'name', e.target.value)
                          }
                          placeholder={
                            isGroup
                              ? 'e.g., Couple Package, VIP Table of 6'
                              : 'e.g., Regular, VIP'
                          }
                          className={inputCls('tierName')}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {isGroup && mode === 'BUNDLE_FIXED'
                            ? 'Subgroup Package Price (KES) *'
                            : 'Price Per Person (KES) *'}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={tier.priceKes}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateTier(index, 'priceKes', val ? Number(val) : 0);
                          }}
                          placeholder="0 for free or custom KES price"
                          className={inputCls('tierPrice')}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {isGroup
                            ? 'Available Seats / Capacity *'
                            : 'Total Quantity *'}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={tier.quantityTotal}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateTier(
                              index,
                              'quantityTotal',
                              val ? Number(val) : 0,
                            );
                          }}
                          placeholder="Total seats or units"
                          className={inputCls('tierQty')}
                        />
                      </div>
                    </div>

                    {form.allowGroupBookings && isGroup && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Group Category
                          </label>
                          <select
                            value={tier.groupCategory || 'FRIENDS'}
                            onChange={(e) =>
                              updateTier(index, 'groupCategory', e.target.value)
                            }
                            className={inputCls('groupCategory')}
                          >
                            {GROUP_CATEGORIES.map((gc) => (
                              <option key={gc} value={gc}>
                                {gc}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Occupants Per Package ({occupants})
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={occupants}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              updateTier(
                                index,
                                'occupantsPerUnit',
                                val ? Math.max(1, Number(val)) : 1,
                              );
                            }}
                            className={inputCls('occupantsPerUnit')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep((s) => s - 1)}
            >
              Previous
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleContinue}
              className="gap-2 bg-brand-gradient text-white border-none"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={saving}
              disabled={saving}
              onClick={() => void handleSave()}
              className="gap-2 bg-brand-gradient text-white border-none"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}