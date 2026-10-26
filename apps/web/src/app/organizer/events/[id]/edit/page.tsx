'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { organizerEventsApi, TicketTier } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { ImageUploader, FullPageLoader } from '@/components/ui';
import { KENYA_COUNTIES, lookupCounty } from '@/lib/kenya-counties';

const CATEGORIES = ['FESTIVAL', 'CONFERENCE', 'ENTERTAINMENT', 'SPORTS', 'ARTS', 'COMMUNITY', 'EDUCATION', 'BUSINESS'];
const FEATURE_OPTIONS = [
  { id: 'general', label: 'General Admission' }, { id: 'standard', label: 'Standard Entry' },
  { id: 'vip', label: 'VIP Access' }, { id: 'wifi', label: 'Free Wi-Fi' },
  { id: 'parking', label: 'Parking Available' }, { id: 'drinks', label: 'Drinks Included' },
  { id: 'food', label: 'Food Available' },
];

function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
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
    title: '', description: '', categoryId: 'FESTIVAL', coverImageUrl: '',
    venueName: '', address: '', county: 'Nairobi', 
    startsAt: '', endsAt: '', maxAttendees: '', isFeatured: false, eventFeatures: [] as string[],
    ticketTiers: [{ name: 'Regular', priceKes: 0, quantityTotal: 100 }] as TicketTier[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const token = getToken();
      if (!token || !id) return;
      try {
        const event = await organizerEventsApi.detail(token, id);
        setForm({
          title: event.title ?? '', description: event.description ?? '', categoryId: event.category?.code ?? 'FESTIVAL',
          coverImageUrl: event.coverImageUrl ?? '', venueName: event.venueName ?? '', address: event.address ?? '',
          county: event.county ?? 'Nairobi', 
          startsAt: toLocalInput(event.startsAt), endsAt: toLocalInput(event.endsAt),
          maxAttendees: event.maxAttendees ? String(event.maxAttendees) : '', isFeatured: event.isFeatured ?? false,
          eventFeatures: event.eventFeatures ?? [],
          ticketTiers: event.ticketTiers?.length ? event.ticketTiers.map(t => ({
            id: t.id, name: t.name, priceKes: t.priceKes, quantityTotal: t.quantityTotal,
            quantitySold: t.quantitySold ?? 0, quantityReserved: t.quantityReserved ?? 0, sortOrder: t.sortOrder ?? 0, isActive: t.isActive ?? true,
          })) : [{ name: 'Regular', priceKes: 0, quantityTotal: 100 }],
        });
      } catch (err: any) { toast.error('Failed to load event', err?.message); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const updateForm = (field: string, value: any) => { setForm((prev) => ({ ...prev, [field]: value })); setErrors((prev) => ({ ...prev, [field]: '' })); };
  const toggleFeature = (id: string) => setForm(prev => ({ ...prev, eventFeatures: prev.eventFeatures.includes(id) ? prev.eventFeatures.filter(f => f !== id) : [...prev.eventFeatures, id] }));
  const updateTier = (index: number, field: keyof TicketTier, value: any) => setForm((prev) => ({ ...prev, ticketTiers: prev.ticketTiers.map((t, i) => i === index ? { ...t, [field]: value } : t) }));

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) { if (!form.title.trim()) e.title = 'Required'; if (!form.description.trim()) e.description = 'Required'; if (!form.coverImageUrl) e.coverImageUrl = 'Required'; }
    if (s === 2) { if (!form.venueName.trim()) e.venueName = 'Required'; if (!form.address.trim()) e.address = 'Required'; if (!form.startsAt) e.startsAt = 'Required'; if (!form.endsAt) e.endsAt = 'Required'; }
    if (s === 3) { if (form.ticketTiers.some(t => !t.name.trim())) e.ticketTiers = 'Required'; }
    return e;
  };

  const handleContinue = () => { const e = validateStep(step); setErrors(e); if (Object.keys(e).length > 0) return toast.error('Missing details', Object.values(e)[0]); setStep((s) => s + 1); };

  const handleSave = async () => {
    const e = validateStep(3); if (Object.keys(e).length > 0) return toast.error('Invalid form', Object.values(e)[0]);
    const token = getToken(); if (!token) return;

    setSaving(true);
    try {
      const coords = lookupCounty(form.county) ?? { lat: -1.2921, lng: 36.8219 };
      const payload = {
        title: form.title.trim(), description: form.description.trim(), categoryId: form.categoryId, coverImageUrl: form.coverImageUrl,
        venueName: form.venueName.trim(), address: form.address.trim(), county: form.county,
        latitude: coords.lat, longitude: coords.lng,
        startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(),
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
        isFeatured: form.isFeatured, eventFeatures: form.eventFeatures,
        ticketTiers: form.ticketTiers.map((t, i) => ({ id: t.id, name: t.name.trim(), priceKes: Number(t.priceKes), quantityTotal: Number(t.quantityTotal), sortOrder: i, isActive: true })),
      };

      await organizerEventsApi.update(token, id, payload);
      toast.success('Event updated!', 'Your changes have been saved.');
      router.push(`/organizer/events/${id}`);
    } catch (err: any) { toast.error('Save failed', err?.message); } finally { setSaving(false); }
  };

  if (loading) return <FullPageLoader message="Loading event..." />;

  const inputCls = (field: string) => `w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-colors border ${errors[field] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-gold'}`;

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <button onClick={() => router.push('/organizer/events')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div><h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">Edit Event</h1><p className="text-sm text-slate-500">Update details for your event.</p></div>

      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-brand-gradient text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{s}</div>
            <span className={`text-xs font-semibold ${step >= s ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>{s === 1 ? 'Basic Info' : s === 2 ? 'Venue & Time' : 'Tickets & Extras'}</span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-brand-gradient' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5">
        {step === 1 && (
          <>
            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Event Title *</label><input type="text" value={form.title} onChange={(e) => updateForm('title', e.target.value)} className={inputCls('title')} /></div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Category *</label>
              <select value={form.categoryId} onChange={(e) => updateForm('categoryId', e.target.value)} className={inputCls('categoryId')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Cover Image *</label><ImageUploader value={form.coverImageUrl} onChange={(url: string) => updateForm('coverImageUrl', url)} /></div>
            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Description *</label><textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={4} className={inputCls('description') + ' resize-none'} /></div>
          </>
        )}

        {step === 2 && (
          <>
            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Venue Name *</label><input type="text" value={form.venueName} onChange={(e) => updateForm('venueName', e.target.value)} className={inputCls('venueName')} /></div>
            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Address *</label><input type="text" value={form.address} onChange={(e) => updateForm('address', e.target.value)} className={inputCls('address')} /></div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">County *</label>
              <select value={form.county} onChange={(e) => updateForm('county', e.target.value)} className={inputCls('county')}>
                {KENYA_COUNTIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Starts At *</label><input type="datetime-local" value={form.startsAt} onChange={(e) => updateForm('startsAt', e.target.value)} className={inputCls('startsAt')} /></div>
              <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Ends At *</label><input type="datetime-local" value={form.endsAt} onChange={(e) => updateForm('endsAt', e.target.value)} className={inputCls('endsAt')} /></div>
            </div>
            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Max Attendees (Optional)</label><input type="text" inputMode="numeric" value={form.maxAttendees} onChange={(e) => updateForm('maxAttendees', e.target.value.replace(/[^0-9]/g, ''))} className={inputCls('maxAttendees')} /></div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div><p className="font-bold text-sm text-slate-800 dark:text-slate-100">Featured Event</p><p className="text-xs text-slate-500">Highlight this event to stand out.</p></div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateForm('isFeatured', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                </label>
              </div>
              
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">Event Features</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {FEATURE_OPTIONS.map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input type="checkbox" checked={form.eventFeatures.includes(opt.id)} onChange={() => toggleFeature(opt.id)} className="w-4 h-4 accent-gold rounded" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Ticket Tiers</h3>
                <button onClick={() => updateForm('ticketTiers', [...form.ticketTiers, { name: '', priceKes: 0, quantityTotal: 50 }])} className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"><Plus className="w-3.5 h-3.5 inline mr-1"/> Add Tier</button>
              </div>
              {form.ticketTiers.map((tier, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tier {index + 1}</span>
                    {form.ticketTiers.length > 1 && <button onClick={() => updateForm('ticketTiers', form.ticketTiers.filter((_, i) => i !== index))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" value={tier.name} onChange={(e) => updateTier(index, 'name', e.target.value)} placeholder="Tier name" className={inputCls('tierName')} />
                    <input type="text" inputMode="numeric" value={tier.priceKes} onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        updateTier(index, 'priceKes', val ? Number(val) : 0);
                    }} placeholder="Price (KES)" className={inputCls('tierPrice')} />
                    <input type="text" inputMode="numeric" value={tier.quantityTotal} onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        updateTier(index, 'quantityTotal', val ? Number(val) : 0);
                    }} placeholder="Quantity" className={inputCls('tierQty')} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Back</button>
        {step < 3 ? (
          <button onClick={handleContinue} className="px-6 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all">Continue →</button>
        ) : (
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 transition-all">
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}
