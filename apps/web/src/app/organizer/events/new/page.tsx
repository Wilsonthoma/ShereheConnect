'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  organizerEventsApi,
  type CreateEventPayload,
  type TicketTier,
} from '@/lib/eventsApi';
import { organizerApi } from '@/lib/organizerApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { Button, FullPageLoader } from '@/components/ui';
import { KENYA_COUNTIES, lookupCounty } from '@/lib/kenya-counties';

const ImageUploader = dynamic(
  () =>
    import('@/components/ui/ImageUploader').then((module) => module.ImageUploader),
  {
    loading: () => (
      <div className="flex h-32 w-full max-w-md items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-600">
        Loading image upload...
      </div>
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

type CreateTierForm = TicketTier & {
  isGroupSubgroup?: boolean;
  groupCategory?: string;
  occupantsPerUnit?: number;
  pricingMode?: 'PER_OCCUPANT' | 'BUNDLE_FIXED';
};

interface TicketTiersConfiguratorProps {
  allowGroupBookings: boolean;
  isFeatured: boolean;
  eventFeatures: string[];
  ticketTiers: CreateTierForm[];
  errors: Record<string, string>;
  inputCls: (field: string) => string;
  onToggleGroupBookings: (enabled: boolean) => void;
  onAddGroupCategoryTier: (category: string) => void;
  onToggleFeatured: (featured: boolean) => void;
  onToggleFeature: (id: string) => void;
  onUpdateTier: <K extends keyof CreateTierForm>(
    index: number,
    field: K,
    value: CreateTierForm[K],
  ) => void;
  onAddTier: () => void;
  onRemoveTier: (index: number) => void;
}

function TicketTiersConfiguratorImpl({
  allowGroupBookings,
  isFeatured,
  eventFeatures,
  ticketTiers,
  errors,
  inputCls,
  onToggleGroupBookings,
  onAddGroupCategoryTier,
  onToggleFeatured,
  onToggleFeature,
  onUpdateTier,
  onAddTier,
  onRemoveTier,
}: TicketTiersConfiguratorProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Allow Group Bookings &amp; Subgroups
            </p>
            <p className="text-xs text-slate-500">
              Enable group subgroups (Couple, Friends, Table, Family) and set a
              custom KES price for each subgroup independently.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={allowGroupBookings}
              onChange={(e) => onToggleGroupBookings(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold" />
          </label>
        </div>

        {allowGroupBookings && (
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
                  onClick={() => onAddGroupCategoryTier(gc)}
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
              checked={isFeatured}
              onChange={(e) => onToggleFeatured(e.target.checked)}
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
            Check amenities or access perks included at the event.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {FEATURE_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={eventFeatures.includes(opt.id)}
                  onChange={() => onToggleFeature(opt.id)}
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
              Each individual tier or group subgroup has its own independent KES
              price.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddTier}
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

        {ticketTiers.map((tier, index) => {
          const isGroup = Boolean(allowGroupBookings && tier.isGroupSubgroup);
          const mode = tier.pricingMode || 'BUNDLE_FIXED';
          const occupants = Math.max(1, Number(tier.occupantsPerUnit || 1));

          return (
            <div
              key={index}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {isGroup
                    ? `Subgroup ${index + 1} (${tier.groupCategory || 'GROUP'})`
                    : `Individual Tier ${index + 1}`}
                </span>
                {ticketTiers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTier(index)}
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
                    onChange={(e) => onUpdateTier(index, 'name', e.target.value)}
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
                      onUpdateTier(index, 'priceKes', val ? Number(val) : 0);
                    }}
                    placeholder="0 for free or custom KES price"
                    className={inputCls('priceKes')}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isGroup ? 'Available Packages / Units *' : 'Quantity Available *'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tier.quantityTotal}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      onUpdateTier(index, 'quantityTotal', val ? Number(val) : 0);
                    }}
                    placeholder="e.g., 50"
                    className={inputCls('quantityTotal')}
                  />
                </div>
              </div>

              {isGroup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Group Category
                    </label>
                    <select
                      value={tier.groupCategory || 'FRIENDS'}
                      onChange={(e) =>
                        onUpdateTier(index, 'groupCategory', e.target.value)
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
                        onUpdateTier(
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
  );
}

const TicketTiersConfigurator = dynamic(
  () => Promise.resolve(TicketTiersConfiguratorImpl),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
    ),
  },
);

export default function CreateEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [step, setStep] = useState(1);

  // Gate state
  const [gateLoading, setGateLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

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
        quantityTotal: 50,
        isGroupSubgroup: false,
        groupCategory: 'FRIENDS',
        occupantsPerUnit: 1,
        pricingMode: 'PER_OCCUPANT',
      },
    ] as CreateTierForm[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    organizerApi
      .getVerificationStatus()
      .then(({ kycStatus: status }) => {
        setKycStatus(status);
        if (status === 'VERIFIED') {
          setIsAllowed(true);
        }
      })
      .catch(() => {})
      .finally(() => setGateLoading(false));
  }, []);

  const updateForm = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleFeature = (id: string) => {
    setForm((prev) => ({
      ...prev,
      eventFeatures: prev.eventFeatures.includes(id)
        ? prev.eventFeatures.filter((f) => f !== id)
        : [...prev.eventFeatures, id],
    }));
  };

  const updateTier = <K extends keyof CreateTierForm>(
    index: number,
    field: K,
    value: CreateTierForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((t, i) =>
        i === index ? { ...t, [field]: value } : t,
      ),
    }));
    setErrors((prev) => ({ ...prev, ticketTiers: '' }));
  };

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
    setErrors((prev) => ({ ...prev, ticketTiers: '' }));
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.title.trim()) e.title = 'Title is required';
      if (!form.description.trim()) e.description = 'Description is required';
      if (!form.coverImageUrl) e.coverImageUrl = 'Cover image is required';
    }
    if (s === 2) {
      if (!form.venueName.trim()) e.venueName = 'Venue is required';
      if (!form.address.trim()) e.address = 'Address is required';
      if (!form.startsAt) e.startsAt = 'Start date is required';
      if (!form.endsAt) e.endsAt = 'End date is required';
      if (
        form.startsAt &&
        form.endsAt &&
        new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()
      ) {
        e.endsAt = 'End date must be after the start date';
      }
      if (form.maxAttendees && Number(form.maxAttendees) < 1) {
        e.maxAttendees = 'Enter at least one attendee';
      }
      if (form.totalTicketsAvailable && Number(form.totalTicketsAvailable) < 1) {
        e.totalTicketsAvailable = 'Enter at least one available ticket';
      }
    }
    if (s === 3) {
      if (form.ticketTiers.length === 0) {
        e.ticketTiers = 'At least one ticket tier is required';
      } else if (form.ticketTiers.some((t) => !t.name.trim())) {
        e.ticketTiers = 'All tiers must have a name';
      } else if (form.ticketTiers.some((t) => Number(t.quantityTotal) <= 0)) {
        e.ticketTiers = 'Quantity must be greater than 0 for every tier';
      } else if (
        form.ticketTiers.some(
          (t) => t.isGroupSubgroup && Number(t.occupantsPerUnit || 1) < 1,
        )
      ) {
        e.ticketTiers = 'Subgroup seats/occupants per unit must be at least 1';
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
    if (!token) {
      toast.error('Session expired', 'Please log in to create an event.');
      router.replace(`/login?next=${encodeURIComponent('/organizer/events/new')}`);
      return;
    }

    setSaving(true);
    try {
      const coords = lookupCounty(form.county) ?? {
        lat: -1.2921,
        lng: 36.8219,
      };

      const payload = {
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
      } as unknown as CreateEventPayload;

      const event = await organizerEventsApi.create(token, payload);
      toast.success('Event created!', 'Redirecting to details...');
      router.push(`/organizer/events/${event.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown error while creating event';
      if (message.toLowerCase().includes('reached the limit')) {
        setUpgradeMessage(message);
      }
      toast.error('Save failed', message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-colors border ${
      errors[field]
        ? 'border-red-500'
        : 'border-slate-200 dark:border-slate-700 focus:border-gold'
    }`;

  if (gateLoading) {
    return <FullPageLoader message="Checking event access..." />;
  }

  if (!isAllowed) {
    const isPending = kycStatus === 'PENDING';
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isPending
                ? 'bg-blue-100 dark:bg-blue-950/50'
                : 'bg-red-100 dark:bg-red-950/50'
            }`}
          >
            {isPending ? (
              <Clock className="w-8 h-8 text-blue-500" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h2 className="heading-display text-2xl text-slate-800 dark:text-slate-100 mb-2">
            {isPending ? 'Verification Pending' : 'Verification Required'}
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            {isPending
              ? 'Your KYC documents are currently being reviewed by our admin team. You will be able to create events as soon as your account is approved.'
              : 'Your organizer account is not yet verified. You must complete KYC and have an approved payment method before you can create events.'}
          </p>

          {!isPending && (
            <Link href="/organizer/onboarding" className="inline-block">
              <Button
                variant="primary"
                size="md"
                className="gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white border-none text-sm font-semibold"
              >
                Complete Onboarding <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.push('/organizer/events')}
        className="gap-2 text-sm text-slate-500 hover:text-gold px-2 py-1 h-auto"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">
          Create Event
        </h1>
        <p className="text-sm text-slate-500">
          Provide all details. Fields marked * are required.
        </p>
      </div>

      {upgradeMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="text-sm">{upgradeMessage}</p>
          <Link
            href="/organizer/subscription"
            className="inline-flex items-center gap-2 text-sm font-bold text-amber-800 hover:underline dark:text-amber-200"
          >
            View plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s
                  ? 'bg-brand-gradient text-white'
                  : 'bg-slate-200 text-slate-500'
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
                Enter the public name of your event (e.g., Nairobi Jazz &amp; Food
                Festival).
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
                Select the category that best fits what attendees will experience.
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
                Upload a clear banner or poster image for event cards and detail
                pages.
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
                Describe the schedule, highlights, entry rules, and what group
                packages include.
              </p>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={4}
                placeholder="Write a clear overview of the event..."
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
                Enter the venue, grounds, or hall name where the event takes place.
              </p>
              <input
                type="text"
                value={form.venueName}
                onChange={(e) => updateForm('venueName', e.target.value)}
                placeholder="e.g., Uhuru Gardens or KICC"
                className={inputCls('venueName')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Address *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Provide the street, road, or landmark directions so guests can find
                the venue.
              </p>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                placeholder="e.g., Lang'ata Road, Gate B"
                className={inputCls('address')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                County *
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Choose the Kenyan county for location search and regional filters.
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
                  Select the date and time doors or activities open.
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
                  Select when the event finishes (must be after start time).
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
                  Maximum total guests/occupants allowed across all tiers.
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
          <TicketTiersConfigurator
            allowGroupBookings={form.allowGroupBookings}
            isFeatured={form.isFeatured}
            eventFeatures={form.eventFeatures}
            ticketTiers={form.ticketTiers}
            errors={errors}
            inputCls={inputCls}
            onToggleGroupBookings={handleToggleGroupBookings}
            onAddGroupCategoryTier={addGroupCategoryTier}
            onToggleFeatured={(checked) => updateForm('isFeatured', checked)}
            onToggleFeature={toggleFeature}
            onUpdateTier={updateTier}
            onAddTier={() =>
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
            onRemoveTier={(index) =>
              updateForm(
                'ticketTiers',
                form.ticketTiers.filter((_, i) => i !== index),
              )
            }
          />
        )}

        <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-xl"
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
              className="gap-2 bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-xl"
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
              onClick={handleSave}
              className="gap-2 bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-xl"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Creating Event...' : 'Create Event'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}