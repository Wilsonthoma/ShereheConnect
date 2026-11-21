'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  TrendingUp,
  Ticket,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, FullPageLoader } from '@/components/ui';

interface AnalyticsEventPerformance {
  id: string;
  title: string;
  ticketsSold: number;
  revenueKes: number;
  status?: string;
}

interface AnalyticsSummaryData {
  totalRevenueKes: number;
  ticketsSold: number;
  activeEvents: number;
  conversionRatePct?: number | null;
  topEvents?: AnalyticsEventPerformance[];
}

function getErrorMessage(err: unknown, fallback = 'Failed to load analytics'): string {
  if (err instanceof Error && err.message) return err.message;
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

function formatKes(amount: number): string {
  return `KES ${Number(amount || 0).toLocaleString('en-KE')}`;
}

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function KpiCard({ icon, label, value }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

interface AnalyticsOverviewSectionProps {
  summary: AnalyticsSummaryData;
}

function AnalyticsOverviewSectionImpl({ summary }: AnalyticsOverviewSectionProps) {
  const topEvents = summary.topEvents ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Gross Ticket Volume"
          value={formatKes(summary.totalRevenueKes)}
        />
        <KpiCard
          icon={<Ticket className="w-5 h-5" />}
          label="Tickets Sold"
          value={Number(summary.ticketsSold || 0).toLocaleString('en-KE')}
        />
        <KpiCard
          icon={<Calendar className="w-5 h-5" />}
          label="Active Events"
          value={Number(summary.activeEvents || 0).toLocaleString('en-KE')}
        />
        <KpiCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Booking Conversion"
          value={
            typeof summary.conversionRatePct === 'number'
              ? `${summary.conversionRatePct.toFixed(1)}%`
              : '—'
          }
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Top Performing Events
          </h3>
        </div>

        {topEvents.length === 0 ? (
          <div className="p-10 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">
              No event metrics recorded yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live ticket sales and revenue breakdowns appear here once events receive bookings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Event
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Tickets Sold
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {topEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                      {ev.title}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-600 dark:text-slate-300">
                      {Number(ev.ticketsSold || 0).toLocaleString('en-KE')}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatKes(ev.revenueKes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const AnalyticsOverviewSection = dynamic(
  () => Promise.resolve(AnalyticsOverviewSectionImpl),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
      </div>
    ),
  },
);

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await api.get<AnalyticsSummaryData>('/organizer/analytics');
      setSummary({
        totalRevenueKes: data?.totalRevenueKes ?? 0,
        ticketsSold: data?.ticketsSold ?? 0,
        activeEvents: data?.activeEvents ?? 0,
        conversionRatePct: data?.conversionRatePct ?? null,
        topEvents: Array.isArray(data?.topEvents) ? data.topEvents : [],
      });
    } catch (err: unknown) {
      toast.error('Failed to load analytics', getErrorMessage(err));
      setSummary((prev) =>
        prev ?? {
          totalRevenueKes: 0,
          ticketsSold: 0,
          activeEvents: 0,
          conversionRatePct: null,
          topEvents: [],
        },
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(false);
  }, [loadAnalytics]);

  if (loading && !summary) {
    return <FullPageLoader message="Loading analytics..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">
            Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track live ticket sales, revenue performance, and event conversions.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={refreshing}
          onClick={() => void loadAnalytics(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {summary && <AnalyticsOverviewSection summary={summary} />}
    </div>
  );
}