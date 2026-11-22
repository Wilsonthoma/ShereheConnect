'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  resolveLabel,
  type GeoCoords,
  type TranslateFn,
} from '@/lib/eventDetailHelpers';

const ImageUploader = dynamic(
  () =>
    import('@/components/ui/ImageUploader').then((module) => module.ImageUploader),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-32 w-full max-w-md items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-600">
        Loading image upload...
      </div>
    ),
  },
);

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
  'FESTIVAL', 'CONFERENCE', 'ENTERTAINMENT', 'SPORTS', 'ARTS', 'COMMUNITY', 'EDUCATION', 'BUSINESS',
];

const FEATURE_OPTIONS = [
  { id: 'general', label: 'General Admission' },
  { id: 'standard', label: 'Standard Entry' },
  { id: 'vip', label: 'VIP Access' },
  { id: 'wifi', label: 'Free Wi-Fi' },
  { id: 'parking', label: 'Parking Available' },
  { id: 'drinks', label: 'Drinks Included' },
  { id: 'food', label: 'Food Available' },
  { id: 'accommodation', label: 'Accommodation Available' },
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
  onUpdateTier: <K extends keyof CreateTierForm>(index: number, field: K, value: CreateTierForm[K]) => void;
  onAddTier: () => void;
  onRemoveTier: (index: number) => void;
}

function TicketTiersConfiguratorImpl({
  allowGroupBookings, isFeatured, eventFeatures, ticketTiers, errors, inputCls,
  onToggleGroupBookings, onAddGroupCategoryTier, onToggleFeatured, onToggleFeature,
  onUpdateTier, onAddTier, onRemoveTier,
}: TicketTiersConfiguratorProps) {
  
  const existingGroupCategories = ticketTiers.filter((t) => t.isGroupSubgroup).map((t) => t.groupCategory);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Allow Group Bookings</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={allowGroupBookings} onChange={(e) => onToggleGroupBookings(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold" />
            </label>
          </div>

          {allowGroupBookings && (
            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Add subgroup packages with custom prices:</span>
              <div className="flex flex-wrap items-center gap-2">
                {GROUP_CATEGORIES.map((gc) => {
                  const isAlreadyAdded = existingGroupCategories.includes(gc);
                  return (
                    <Button key={gc} type="button" variant="outline" size="sm" disabled={isAlreadyAdded} onClick={() => onAddGroupCategoryTier(gc)}
                      className={`text-xs font-semibold px-3 py-1.5 h-auto rounded-lg transition-all ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-gold text-slate-700 dark:text-slate-200'}`}
                    >
                      {!isAlreadyAdded && <Plus className="w-3 h-3 mr-1" />} {gc}
                    </Button>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                <Button type="button" variant="secondary" size="sm" onClick={onAddTier} className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-4 py-2 h-auto rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 w-full">
                  <Plus className="w-4 h-4 mr-1" /> Add Individual Ticket Tier
                </Button>
              </div>
            </div>
          )}

          {!allowGroupBookings && (
            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <Button type="button" variant="secondary" size="sm" onClick={onAddTier} className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-4 py-2 h-auto rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 w-full">
                <Plus className="w-4 h-4 mr-1" /> Add Individual Ticket Tier
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div><p className="font-bold text-sm text-slate-800 dark:text-slate-100">Featured Event</p></div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isFeatured} onChange={(e) => onToggleFeatured(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold" />
          </label>
        </div>

        <div>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">Event Features</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {FEATURE_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <input type="checkbox" checked={eventFeatures.includes(opt.id)} onChange={() => onToggleFeature(opt.id)} className="w-4 h-4 accent-gold rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        {errors.ticketTiers && <p className="text-xs font-semibold text-red-500">{errors.ticketTiers}</p>}
        {ticketTiers.map((tier, index) => {
          const isGroup = Boolean(allowGroupBookings && tier.isGroupSubgroup);
          const mode = tier.pricingMode || 'BUNDLE_FIXED';
          const occupants = Math.max(1, Number(tier.occupantsPerUnit || 1));

          return (
            <div key={index} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{isGroup ? `${tier.groupCategory} Package` : `Individual Tier ${index + 1}`}</span>
                {ticketTiers.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveTier(index)} className="text-red-500 hover:text-red-600 p-1.5 h-auto min-w-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">{isGroup ? 'Subgroup Name' : 'Tier Name'}</label>
                  <input type="text" value={tier.name} onChange={(e) => onUpdateTier(index, 'name', e.target.value)} placeholder={isGroup ? 'e.g., VIP Table of 6' : 'e.g., Regular, VIP'} className={inputCls('tierName')} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">{isGroup && mode === 'BUNDLE_FIXED' ? 'Package Price (KES)' : 'Price Per Person (KES)'}</label>
                  <input type="text" inputMode="numeric" value={tier.priceKes} onChange={(e) => onUpdateTier(index, 'priceKes', e.target.value.replace(/[^0-9]/g, '') ? Number(e.target.value) : 0)} placeholder="0 for free" className={inputCls('priceKes')} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">{isGroup ? 'Available Packages' : 'Quantity Available'}</label>
                  <input type="text" inputMode="numeric" value={tier.quantityTotal} onChange={(e) => onUpdateTier(index, 'quantityTotal', e.target.value.replace(/[^0-9]/g, '') ? Number(e.target.value) : 0)} placeholder="e.g., 50" className={inputCls('quantityTotal')} />
                </div>
              </div>

              {isGroup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Occupants Per Package ({occupants})</label>
                    <input type="text" inputMode="numeric" value={occupants} onChange={(e) => onUpdateTier(index, 'occupantsPerUnit', e.target.value.replace(/[^0-9]/g, '') ? Math.max(1, Number(e.target.value)) : 1)} className={inputCls('occupantsPerUnit')} />
                  </div>
                  <div className="flex items-end pb-2"><p className="text-xs text-slate-500">Fixed <strong>{tier.groupCategory}</strong> package.</p></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TicketTiersConfigurator = dynamic(() => Promise.resolve(TicketTiersConfiguratorImpl), { ssr: false, loading: () => <div className="h-64 w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" /> });

export default function CreateEventPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isSw = language === 'sw';
  const tr = useCallback<TranslateFn>((key, interpParams) => resolveLabel(t, isSw, key, interpParams), [t, isSw]);

  const [saving, setSaving] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [step, setStep] = useState(1);

  const [gateLoading, setGateLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [pinnedCoords, setPinnedCoords] = useState<GeoCoords | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', categoryId: 'FESTIVAL', coverImageUrl: '',
    venueName: '', county: '', startsAt: '', endsAt: '',
    maxAttendees: '', totalTicketsAvailable: '', allowGroupBookings: false,
    isFeatured: false, eventFeatures: [] as string[],
    ticketTiers: [{ name: 'Regular', priceKes: 0, quantityTotal: 50, isGroupSubgroup: false, groupCategory: 'FRIENDS', occupantsPerUnit: 1, pricingMode: 'PER_OCCUPANT' }] as CreateTierForm[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    organizerApi.getVerificationStatus().then(({ kycStatus: status }) => {
      setKycStatus(status);
      if (status === 'VERIFIED') setIsAllowed(true);
    }).catch(() => {}).finally(() => setGateLoading(false));
  }, []);

  const updateForm = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Maps provide coordinates, but the user MUST type the Venue Name
  const handleLocationChange = useCallback((coords: GeoCoords) => {
      setPinnedCoords(coords);
      setErrors((prev) => ({ ...prev, location: '' }));
    }, []);

  const toggleFeature = (id: string) => {
    setForm((prev) => ({ ...prev, eventFeatures: prev.eventFeatures.includes(id) ? prev.eventFeatures.filter((f) => f !== id) : [...prev.eventFeatures, id] }));
  };

  const updateTier = <K extends keyof CreateTierForm>(index: number, field: K, value: CreateTierForm[K]) => {
    setForm((prev) => ({ ...prev, ticketTiers: prev.ticketTiers.map((t, i) => i === index ? { ...t, [field]: value } : t) }));
    setErrors((prev) => ({ ...prev, ticketTiers: '' }));
  };

  const addTier = () => { setForm((prev) => ({ ...prev, ticketTiers: [...prev.ticketTiers, { name: '', priceKes: 0, quantityTotal: 50, isGroupSubgroup: false, groupCategory: 'FRIENDS', occupantsPerUnit: 1, pricingMode: 'PER_OCCUPANT' }] })); setErrors((prev) => ({ ...prev, ticketTiers: '' })); };
  const removeTier = (index: number) => { setForm((prev) => ({ ...prev, ticketTiers: prev.ticketTiers.filter((_, i) => i !== index) })); };
  const handleToggleGroupBookings = (enabled: boolean) => { setForm((prev) => ({ ...prev, allowGroupBookings: enabled, ticketTiers: enabled ? prev.ticketTiers : prev.ticketTiers.map((t) => t.isGroupSubgroup ? { ...t, isGroupSubgroup: false, occupantsPerUnit: 1, pricingMode: 'PER_OCCUPANT' } : t) })); };

  const addGroupCategoryTier = (category: string) => {
    const defaultOccupants = category === 'COUPLE' ? 2 : category === 'TABLE' ? 6 : 4;
    setForm((prev) => ({ ...prev, allowGroupBookings: true, ticketTiers: [...prev.ticketTiers, { name: `${category.charAt(0) + category.slice(1).toLowerCase()} Package`, priceKes: 0, quantityTotal: 10, isGroupSubgroup: true, groupCategory: category, occupantsPerUnit: defaultOccupants, pricingMode: 'BUNDLE_FIXED' }] }));
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
      if (!form.venueName.trim()) e.venueName = 'Venue name is required'; // FORCED MANUAL INPUT
      if (!pinnedCoords) e.venueName = 'Please pin a location on the map';
      if (!form.startsAt) e.startsAt = 'Start date is required';
      if (!form.endsAt) e.endsAt = 'End date is required';
      if (form.startsAt && form.endsAt && new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) e.endsAt = 'End date must be after the start date';
    }
    if (s === 3) {
      if (form.ticketTiers.length === 0) e.ticketTiers = 'At least one tier required';
      else if (form.ticketTiers.some((t) => !t.name.trim())) e.ticketTiers = 'All tiers must have a name';
      else if (form.ticketTiers.some((t) => Number(t.quantityTotal) <= 0)) e.ticketTiers = 'Quantity must be > 0';
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
    const e = { ...validateStep(2), ...validateStep(3) };
    setErrors(e);
    if (Object.keys(e).length > 0) return toast.error('Invalid form', Object.values(e)[0]);

    const token = getToken();
    if (!token) { toast.error('Session expired', 'Please log in.'); return router.replace(`/login?next=${encodeURIComponent('/organizer/events/new')}`); }

    setSaving(true);
    try {
      const resolvedCoords = pinnedCoords ?? { lat: -1.2921, lng: 36.8219 };
      const payload = {
        title: form.title.trim(), description: form.description.trim(), categoryId: form.categoryId, coverImageUrl: form.coverImageUrl,
        venueName: form.venueName.trim(), address: form.venueName.trim(), county: form.county || 'Nairobi',
        latitude: Number(resolvedCoords.lat.toFixed(6)), longitude: Number(resolvedCoords.lng.toFixed(6)),
        startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(),
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : undefined, totalTicketsAvailable: form.totalTicketsAvailable ? parseInt(form.totalTicketsAvailable, 10) : undefined,
        allowGroupBookings: form.allowGroupBookings, isFeatured: form.isFeatured, eventFeatures: form.eventFeatures,
        ticketTiers: form.ticketTiers.map((t, i) => {
          const isGroup = Boolean(form.allowGroupBookings && t.isGroupSubgroup);
          const occupants = isGroup ? Math.max(1, Number(t.occupantsPerUnit || 1)) : 1;
          return { name: t.name.trim(), priceKes: Math.max(0, Number(t.priceKes)), quantityTotal: Math.max(1, Number(t.quantityTotal)), isGroupSubgroup: isGroup, groupCategory: isGroup ? t.groupCategory || 'FRIENDS' : null, occupantsPerUnit: occupants, pricingMode: isGroup ? t.pricingMode || 'BUNDLE_FIXED' : 'PER_OCCUPANT', sortOrder: i, isActive: true };
        }),
      } as unknown as CreateEventPayload;

      const event = await organizerEventsApi.create(token, payload);
      toast.success('Event created!', 'Redirecting...');
      router.push(`/organizer/events/${event.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.toLowerCase().includes('reached the limit')) setUpgradeMessage(message);
      toast.error('Save failed', message);
    } finally { setSaving(false); }
  };

  const inputCls = (field: string) => `w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-colors border ${errors[field] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-gold'}`;

  if (gateLoading) return <FullPageLoader message="Checking event access..." />;
  if (!isAllowed) return (
      <div className="max-w-2xl mx-auto mt-10"><div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${kycStatus === 'PENDING' ? 'bg-blue-100 text-blue-500' : 'bg-red-100 text-red-500'}`}>{kycStatus === 'PENDING' ? <Clock className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}</div>
          <h2 className="heading-display text-2xl mb-2">{kycStatus === 'PENDING' ? 'Verification Pending' : 'Verification Required'}</h2>
          <p className="text-sm text-slate-500 mb-6">{kycStatus === 'PENDING' ? 'Your KYC documents are being reviewed.' : 'You must complete KYC before you can create events.'}</p>
          {kycStatus !== 'PENDING' && <Link href="/organizer/onboarding"><Button variant="primary" size="md" className="gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white border-none">Complete Onboarding <ArrowRight className="w-4 h-4" /></Button></Link>}
      </div></div>
  );

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/organizer/events')} className="gap-2 text-sm text-slate-500 hover:text-gold px-2 py-1 h-auto"><ArrowLeft className="w-4 h-4" /> Back</Button>
      <div><h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">Create Event</h1></div>
      
      {upgradeMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="text-sm">{upgradeMessage}</p>
          <Link href="/organizer/subscription" className="inline-flex items-center gap-2 text-sm font-bold text-amber-800 hover:underline dark:text-amber-200">View plans <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-brand-gradient text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
            <span className={`text-xs font-semibold ${step >= s ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>{s === 1 ? 'Basic Info' : s === 2 ? 'Venue & Time' : 'Tickets & Extras'}</span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-brand-gradient' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6">
        {step === 1 && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Event Title *</label>
              <input type="text" value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="e.g., Nairobi Jazz & Food Festival" className={inputCls('title')} />
              {errors.title && <p className="text-xs font-semibold text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Category *</label>
              <select value={form.categoryId} onChange={(e) => updateForm('categoryId', e.target.value)} className={inputCls('categoryId')}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Cover Image *</label>
              <ImageUploader value={form.coverImageUrl} onChange={(url: string) => updateForm('coverImageUrl', url)} />
              {errors.coverImageUrl && <p className="text-xs font-semibold text-red-500 mt-1">{errors.coverImageUrl}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Description *</label>
              <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={4} placeholder="Write a clear overview of the event..." className={`${inputCls('description')} resize-none`} />
              {errors.description && <p className="text-xs font-semibold text-red-500 mt-1">{errors.description}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Venue Name *</label>
                <input type="text" value={form.venueName} onChange={(e) => updateForm('venueName', e.target.value)} placeholder="e.g., KICC, Nairobi" className={inputCls('venueName')} />
                {errors.venueName && <p className="text-xs font-semibold text-red-500 mt-1">{errors.venueName}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">County *</label>
                <input type="text" value={form.county} onChange={(e) => updateForm('county', e.target.value)} placeholder="e.g., Nairobi" className={inputCls('county')} />
              </div>
            </div>

            <div className="pt-2">
               <OrganizerLocationPicker value={pinnedCoords} venueName={form.venueName} onChange={handleLocationChange} tr={tr} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Starts At *</label><input type="datetime-local" value={form.startsAt} onChange={(e) => updateForm('startsAt', e.target.value)} className={inputCls('startsAt')} />{errors.startsAt && <p className="text-xs font-semibold text-red-500 mt-1">{errors.startsAt}</p>}</div>
              <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Ends At *</label><input type="datetime-local" value={form.endsAt} onChange={(e) => updateForm('endsAt', e.target.value)} className={inputCls('endsAt')} />{errors.endsAt && <p className="text-xs font-semibold text-red-500 mt-1">{errors.endsAt}</p>}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Max Attendees (Optional)</label><input type="text" inputMode="numeric" value={form.maxAttendees} onChange={(e) => updateForm('maxAttendees', e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g., 200" className={inputCls('maxAttendees')} /></div>
              <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Total Tickets Available (Optional)</label><input type="text" inputMode="numeric" value={form.totalTicketsAvailable} onChange={(e) => updateForm('totalTicketsAvailable', e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g., 150" className={inputCls('totalTicketsAvailable')} /></div>
            </div>
          </>
        )}

        {step === 3 && <TicketTiersConfigurator allowGroupBookings={form.allowGroupBookings} isFeatured={form.isFeatured} eventFeatures={form.eventFeatures} ticketTiers={form.ticketTiers} errors={errors} inputCls={inputCls} onToggleGroupBookings={handleToggleGroupBookings} onAddGroupCategoryTier={addGroupCategoryTier} onToggleFeatured={(val) => updateForm('isFeatured', val)} onToggleFeature={toggleFeature} onUpdateTier={updateTier} onAddTier={addTier} onRemoveTier={removeTier} />}

        <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? <Button type="button" variant="outline" size="md" onClick={() => setStep((s) => s - 1)}>Previous</Button> : <div />}
          {step < 3 ? <Button type="button" variant="primary" size="md" onClick={handleContinue} className="gap-2 bg-brand-gradient text-white border-none">Continue <ArrowRight className="w-4 h-4" /></Button> : <Button type="button" variant="primary" size="md" isLoading={saving} disabled={saving} onClick={() => void handleSave()} className="gap-2 bg-brand-gradient text-white border-none"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Create Event'}</Button>}
        </div>
      </div>
    </div>
  );
}