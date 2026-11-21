'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { organizerEventsApi, TicketTier } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { ImageUploader, FullPageLoader } from '@/components/ui';
import { KENYA_COUNTIES, lookupCounty } from '@/lib/kenya-counties';

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

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
    load();
  }, [id]);

  const updateForm = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

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
      if (form.ticketTiers.some((t) => !t.name.trim())) e.ticketTiers = 'Required';
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
    const e = validateStep(3);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error('Invalid form', Object.values(e)[0]);
      return;
    }
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const coords = lookupCounty(form.county) ?? { lat: -1.2921, lng: 36.8219 };
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        coverImageUrl: form.coverImageUrl,
        venueName: form.venueName.trim(),
        address: form.address.trim(),
        county: form.county,
        latitude: coords.lat,
        longitude: coords.lng,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : undefined,
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
          const mode = isGroup ? t.pricingMode || 'BUNDLE_FIXED' : 'PER_OCCUPANT';

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
      <button
        type="button"
        onClick={() => router.push('/organizer/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
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
              {s === 1 ? 'Basic Info' : s === 2 ? 'Venue & Time' : 'Tickets & Extras'}
            </span>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 ${
                  step > s ? 'bg-brand-gradient' : 'bg-slate-200 dark:bg-slate-700'
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
                    Enable group subgroups (Couple, Friends, Table, Family) with custom per-subgroup prices.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowGroupBookings}
                    onChange={(e) => handleToggleGroupBookings(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                </label>
              </div>

              {form.allowGroupBookings && (
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Add subgroup packages with custom prices:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {GROUP_CATEGORIES.map((gc) => (
                      <button
                        key={gc}
                        type="button"
                        onClick={() => addGroupCategoryTier(gc)}
                        className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg hover:border-gold transition-colors"
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        {gc}
                      </button>
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
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
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
                    Set each tier or subgroup&apos;s own KES price (0 for free) and available seats/units.
                  </p>
                </div>
                <button
                  type="button"
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
                  className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Tier
                </button>
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
                        <button
                          type="button"
                          onClick={() =>
                            updateForm(
                              'ticketTiers',
                              form.ticketTiers.filter((_, i) => i !== index),
                            )
                          }
                          aria-label={`Remove ticket tier ${index + 1}`}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                          onChange={(e) => updateTier(index, 'name', e.target.value)}
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

                    {form.allowGroupBookings && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 pb-2">
                          <input
                            type="checkbox"
                            checked={Boolean(tier.isGroupSubgroup)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateTier(index, 'isGroupSubgroup', checked);
                              if (checked && !tier.pricingMode) {
                                updateTier(index, 'pricingMode', 'BUNDLE_FIXED');
                              }
                            }}
                            className="w-4 h-4 accent-gold rounded"
                          />
                          Group Subgroup
                        </label>

                        {tier.isGroupSubgroup && (
                          <>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                Subgroup Type
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
                                People Per Unit
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={occupants}
                                onChange={(e) =>
                                  updateTier(
                                    index,
                                    'occupantsPerUnit',
                                    Math.max(1, Number(e.target.value) || 1),
                                  )
                                }
                                placeholder="Guests per unit (e.g., 4)"
                                className={inputCls('occupantsPerUnit')}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                Custom Price Rule
                              </label>
                              <select
                                value={mode}
                                onChange={(e) =>
                                  updateTier(
                                    index,
                                    'pricingMode',
                                    e.target.value as
                                      | 'PER_OCCUPANT'
                                      | 'BUNDLE_FIXED',
                                  )
                                }
                                className={inputCls('pricingMode')}
                              >
                                <option value="BUNDLE_FIXED">
                                  Fixed Price Per Subgroup
                                </option>
                                <option value="PER_OCCUPANT">
                                  Per Person in Subgroup
                                </option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={handleContinue}
            className="px-6 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}