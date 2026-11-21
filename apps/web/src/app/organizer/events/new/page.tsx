'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { organizerEventsApi, TicketTier } from '@/lib/eventsApi';
import { organizerApi } from '@/lib/organizerApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader } from '@/components/ui';
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

const CATEGORIES = ['FESTIVAL', 'CONFERENCE', 'ENTERTAINMENT', 'SPORTS', 'ARTS', 'COMMUNITY', 'EDUCATION', 'BUSINESS'];
const FEATURE_OPTIONS = [
  { id: 'general', label: 'General Admission' }, { id: 'standard', label: 'Standard Entry' },
  { id: 'vip', label: 'VIP Access' }, { id: 'wifi', label: 'Free Wi-Fi' },
  { id: 'parking', label: 'Parking Available' }, { id: 'drinks', label: 'Drinks Included' },
  { id: 'food', label: 'Food Available' },
];
const GROUP_CATEGORIES = ['FAMILY', 'COUPLE', 'FRIENDS', 'TABLE'];

type CreateTierForm = TicketTier & {
  isGroupSubgroup?: boolean;
  groupCategory?: string;
  occupantsPerUnit?: number;
  pricingMode?: 'PER_OCCUPANT' | 'BUNDLE_FIXED';
};

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

  const updateForm = (field: string, value: any) => {
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

  const updateTier = (index: number, field: keyof CreateTierForm, value: any) => {
    setForm((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((t, i) =>
        i === index ? { ...t, [field]: value } : t,
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
      if (form.ticketTiers.some((t) => !t.name.trim())) e.ticketTiers = 'All tiers must have a name';
      if (form.ticketTiers.some((t) => t.quantityTotal <= 0)) e.ticketTiers = 'Quantity must be greater than 0';
    }
    return e;
  };

  const handleContinue = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length > 0) return toast.error('Missing details', Object.values(e)[0]);
    setStep((s) => s + 1);
  };

  const handleSave = async () => {
    const e = validateStep(3);
    if (Object.keys(e).length > 0) return toast.error('Invalid form', Object.values(e)[0]);

    const token = getToken();
    if (!token) {
      toast.error('Session expired', 'Please log in to create an event.');
      router.replace(`/login?next=${encodeURIComponent('/organizer/events/new')}`);
      return;
    }

    setSaving(true);
    try {
      const coords = lookupCounty(form.county) ?? { lat: -1.2921, lng: 36.8219 };

      const payload: any = {
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
        ticketTiers: form.ticketTiers.map((t, i) => ({
          name: t.name.trim(),
          priceKes: Number(t.priceKes),
          quantityTotal: Number(t.quantityTotal),
          isGroupSubgroup: Boolean(t.isGroupSubgroup),
          groupCategory: t.isGroupSubgroup ? t.groupCategory || 'FRIENDS' : null,
          occupantsPerUnit: t.isGroupSubgroup
            ? Math.max(1, Number(t.occupantsPerUnit || 1))
            : 1,
          pricingMode: t.isGroupSubgroup
            ? t.pricingMode || 'PER_OCCUPANT'
            : 'PER_OCCUPANT',
          sortOrder: i,
          isActive: true,
        })),
      };

      const event = await organizerEventsApi.create(token, payload);
      toast.success('Event created!', 'Redirecting to details...');
      router.push(`/organizer/events/${event.id}`);
    } catch (err: any) {
      const message = err?.message ?? 'Unknown error';
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
            <Link
              href="/organizer/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              Complete Onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <button
        onClick={() => router.push('/organizer/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

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
                Enter the public name of your event (e.g., Nairobi Jazz &amp; Food Festival).
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
                Upload a clear banner or poster image for event cards and detail pages.
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
                Describe the schedule, highlights, entry rules, and what group packages include.
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
                Provide the street, road, or landmark directions so guests can find the venue.
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
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Allow Group Bookings &amp; Subgroups
                  </p>
                  <p className="text-xs text-slate-500">
                    Enable multiple group tiers (Family, Couple, Friends, or Table) with occupant counts and bundle or per-occupant pricing.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowGroupBookings}
                    onChange={(e) =>
                      updateForm('allowGroupBookings', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                </label>
              </div>

              {form.allowGroupBookings && (
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Quick-add group categories (select multiple):
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
                    Ticket Tiers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set tier name, price in KES (0 for free), and total available seats/units.
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
              {form.ticketTiers.map((tier, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Tier {index + 1}
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
                        Tier Name *
                      </label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(index, 'name', e.target.value)}
                        placeholder="e.g., Regular, VIP, Family of 4"
                        className={inputCls('tierName')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Price (KES) *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tier.priceKes}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          updateTier(index, 'priceKes', val ? Number(val) : 0);
                        }}
                        placeholder="0 for free or KES amount"
                        className={inputCls('tierPrice')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Total Quantity *
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
                          onChange={(e) =>
                            updateTier(index, 'isGroupSubgroup', e.target.checked)
                          }
                          className="w-4 h-4 accent-gold rounded"
                        />
                        Group Subgroup
                      </label>

                      {tier.isGroupSubgroup && (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              Group Type
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
                              Occupants / Unit
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={tier.occupantsPerUnit ?? 1}
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
                              Pricing Mode
                            </label>
                            <select
                              value={tier.pricingMode || 'PER_OCCUPANT'}
                              onChange={(e) =>
                                updateTier(
                                  index,
                                  'pricingMode',
                                  e.target.value as 'PER_OCCUPANT' | 'BUNDLE_FIXED',
                                )
                              }
                              className={inputCls('pricingMode')}
                            >
                              <option value="PER_OCCUPANT">Per Occupant</option>
                              <option value="BUNDLE_FIXED">Fixed Bundle</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              className="px-6 py-2.5 rounded-lg bg-brand-gradient text-white text-sm font-semibold hover:opacity-95 transition-opacity"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-gradient text-white text-sm font-semibold disabled:opacity-50 hover:opacity-95 transition-opacity"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Create Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}