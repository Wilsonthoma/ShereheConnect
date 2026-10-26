'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { organizerEventsApi, TicketTier } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { ImageUploader } from '@/components/ui';

interface FormState {
  title: string;
  description: string;
  categoryId: string;
  coverImageUrl: string;
  venueName: string;
  address: string;
  county: string;
  startsAt: string;
  endsAt: string;
  maxAttendees: string;
  ticketTiers: TicketTier[];
}

const KENYA_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
  'Kitale', 'Garissa', 'Kakamega', 'Nyeri', 'Meru', 'Machakos', 'Naivasha',
  'Lamu', 'Diani', 'Kwale', 'Kilifi', 'Bungoma', 'Kericho', 'Embu',
];

const CATEGORIES = [
  { code: 'FESTIVAL', name: 'Festivals' },
  { code: 'CONFERENCE', name: 'Conferences' },
  { code: 'ENTERTAINMENT', name: 'Entertainment' },
  { code: 'SPORTS', name: 'Sports' },
  { code: 'ARTS', name: 'Arts & Culture' },
  { code: 'COMMUNITY', name: 'Community' },
  { code: 'EDUCATION', name: 'Workshops & Education' },
  { code: 'BUSINESS', name: 'Business & Networking' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    categoryId: '',
    coverImageUrl: '',
    venueName: '',
    address: '',
    county: 'Nairobi',
    startsAt: '',
    endsAt: '',
    maxAttendees: '',
    ticketTiers: [{ name: 'Regular', priceKes: 0, quantityTotal: 100 }],
  });

  const updateForm = (field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateTier = (index: number, field: keyof TicketTier, value: any) => {
    setForm((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((t, i) =>
        i === index ? { ...t, [field]: value } : t,
      ),
    }));
  };

  const addTier = () => {
    setForm((prev) => ({
      ...prev,
      ticketTiers: [
        ...prev.ticketTiers,
        { name: 'New Tier', priceKes: 0, quantityTotal: 50 },
      ],
    }));
  };

  const removeTier = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter((_, i) => i !== index),
    }));
  };

  const canProceed = () => {
    if (step === 1) {
      return form.title.length >= 3 && form.description.length >= 10;
    }
    if (step === 2) {
      return (
        form.venueName.length >= 2 &&
        form.address.length >= 3 &&
        form.startsAt &&
        form.endsAt &&
        new Date(form.endsAt) > new Date(form.startsAt)
      );
    }
    if (step === 3) {
      return (
        form.ticketTiers.length > 0 &&
        form.ticketTiers.every((t) => t.name && t.quantityTotal > 0)
      );
    }
    return true;
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        venueName: form.venueName,
        address: form.address,
        county: form.county,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        maxAttendees: form.maxAttendees
          ? parseInt(form.maxAttendees)
          : undefined,
        ticketTiers: form.ticketTiers.map((t, i) => ({
          name: t.name,
          priceKes: Number(t.priceKes),
          quantityTotal: Number(t.quantityTotal),
          sortOrder: i,
          isActive: true,
        })),
      };

      const event = await organizerEventsApi.create(token, payload);
      toast.success(
        'Event created!',
        'You can now edit or submit for approval.',
      );
      router.push(`/organizer/events/${event.id}`);
    } catch (err: any) {
      toast.error('Save failed', err?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        onClick={() => router.push('/organizer/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Events
      </button>

      <div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Create Event
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Fill in the details below. You can save as draft and submit for
          approval later.
        </p>
      </div>

      <div className="flex items-center gap-3">
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
              {s === 1 ? 'Basic Info' : s === 2 ? 'Venue & Date' : 'Tickets'}
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-4">
            <FormField label="Event Title *">
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="e.g. Blankets & Wine 2026"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors"
              />
            </FormField>

            <FormField label="Category">
              <select
                value={form.categoryId}
                onChange={(e) => updateForm('categoryId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors"
              >
                <option value="">Choose a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Description *">
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Tell attendees about your event..."
                rows={6}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors resize-none"
              />
            </FormField>

            <ImageUploader
              value={form.coverImageUrl}
              onChange={(url) => updateForm('coverImageUrl', url)}
              label="Cover Image"
              aspect="wide"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 -mt-1">
              Upload a high-quality image. This is the first thing attendees see.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <FormField label="Venue Name *">
              <input
                type="text"
                value={form.venueName}
                onChange={(e) => updateForm('venueName', e.target.value)}
                placeholder="e.g. Ngong Race Course"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors"
              />
            </FormField>

            <FormField label="Address *">
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                placeholder="e.g. Ngong Road, Nairobi"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors"
              />
            </FormField>

            <FormField label="County *">
              <select
                value={form.county}
                onChange={(e) => updateForm('county', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors"
              >
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Starts *">
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => updateForm('startsAt', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors"
                />
              </FormField>
              <FormField label="Ends *">
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => updateForm('endsAt', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors"
                />
              </FormField>
            </div>

            <FormField label="Max Attendees (optional)">
              <input
                type="number"
                value={form.maxAttendees}
                onChange={(e) => updateForm('maxAttendees', e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold transition-colors"
              />
            </FormField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                Ticket Tiers
              </h3>
              <button
                onClick={addTier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tier
              </button>
            </div>

            {form.ticketTiers.map((tier, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Tier {index + 1}
                  </span>
                  {form.ticketTiers.length > 1 && (
                    <button
                      onClick={() => removeTier(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) =>
                      updateTier(index, 'name', e.target.value)
                    }
                    placeholder="Tier name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-gold"
                  />
                  <input
                    type="number"
                    value={tier.priceKes || 0}
                    onChange={(e) =>
                      updateTier(index, 'priceKes', Number(e.target.value))
                    }
                    placeholder="Price (KES)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-gold"
                  />
                  <input
                    type="number"
                    value={tier.quantityTotal || 0}
                    onChange={(e) =>
                      updateTier(
                        index,
                        'quantityTotal',
                        Number(e.target.value),
                      )
                    }
                    placeholder="Quantity"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-gold"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="px-6 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:transform-none transition-all"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !canProceed()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:transform-none transition-all"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save as Draft
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
