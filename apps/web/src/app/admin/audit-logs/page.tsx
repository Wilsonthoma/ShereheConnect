'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ClipboardList,
  Search,
  RefreshCw,
  Eye,
  X,
  User,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, FullPageLoader } from '@/components/ui';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

interface AuditLogsResponse {
  items: AuditLogEntry[];
  total: number;
}

function getErrorMessage(err: unknown, fallback = 'Failed to load audit logs'): string {
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

function formatActionLabel(action: string): string {
  return action.replace(/[_.-]+/g, ' ').trim();
}

interface AuditLogDetailModalProps {
  log: AuditLogEntry;
  onClose: () => void;
}

function AuditLogDetailModalImpl({ log, onClose }: AuditLogDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              {formatActionLabel(log.action)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(log.createdAt).toLocaleString('en-KE')}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close audit log details"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-slate-500 dark:text-slate-400 mb-1">Actor</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100 break-all">
              {log.actorEmail || log.actorId || 'System'}
            </p>
            {log.actorRole && (
              <p className="text-[0.65rem] uppercase font-bold text-gold mt-0.5">
                {log.actorRole}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-slate-500 dark:text-slate-400 mb-1">Target</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {log.entityType || '—'}
            </p>
            {log.entityId && (
              <p className="font-mono text-[0.7rem] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {log.entityId}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Payload / Metadata
          </p>
          <pre className="text-xs p-3.5 rounded-xl bg-slate-950 text-slate-100 overflow-x-auto max-h-60 border border-slate-800">
            {JSON.stringify(
              log.metadata ?? {
                id: log.id,
                action: log.action,
                ipAddress: log.ipAddress ?? null,
              },
              null,
              2,
            )}
          </pre>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

const AuditLogDetailModal = dynamic(
  () => Promise.resolve(AuditLogDetailModalImpl),
  { ssr: false },
);

interface AuditLogsTableSectionProps {
  logs: AuditLogEntry[];
  onInspect: (log: AuditLogEntry) => void;
}

function AuditLogsTableSectionImpl({
  logs,
  onInspect,
}: AuditLogsTableSectionProps) {
  if (logs.length === 0) {
    return (
      <div className="p-12 text-center">
        <ClipboardList className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">
          No audit logs found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Administrative and platform activity entries will appear here once recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Action
            </th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Actor
            </th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Target
            </th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Timestamp
            </th>
            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry) => (
            <tr
              key={entry.id}
              className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="inline-block px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase tracking-wide bg-gold/10 text-gold">
                  {formatActionLabel(entry.action)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[200px]">
                    {entry.actorEmail || entry.actorId || 'System'}
                  </span>
                </div>
                {entry.ipAddress && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    IP: {entry.ipAddress}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold">{entry.entityType || '—'}</p>
                {entry.entityId && (
                  <p className="font-mono text-[0.7rem] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                    {entry.entityId}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(entry.createdAt).toLocaleString('en-KE')}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onInspect(entry)}
                  aria-label={`Inspect ${entry.action}`}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-gold dark:hover:text-gold"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const AuditLogsTableSection = dynamic(
  () => Promise.resolve(AuditLogsTableSectionImpl),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/70 animate-pulse"
          />
        ))}
      </div>
    ),
  },
);

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim());
        }

        const res = await api.get<AuditLogsResponse | AuditLogEntry[]>(
          `/admin/audit-logs?${params.toString()}`,
        );

        if (Array.isArray(res)) {
          setLogs(res);
          setTotal(res.length);
        } else {
          setLogs(Array.isArray(res?.items) ? res.items : []);
          setTotal(typeof res?.total === 'number' ? res.total : 0);
        }
      } catch (err: unknown) {
        toast.error('Failed to load audit logs', getErrorMessage(err));
        setLogs([]);
        setTotal(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, searchQuery],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLogs(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">
            Audit Logs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track administrative actions, verification updates, and account changes.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={refreshing}
          onClick={() => void loadLogs(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 flex-1 max-w-md focus-within:border-gold dark:focus-within:border-gold transition-colors">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by action, actor, or entity..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        {total > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {total} log{total === 1 ? '' : 's'} · Page {page} of {totalPages}
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading && logs.length === 0 ? (
          <FullPageLoader message="Loading audit logs..." />
        ) : (
          <AuditLogsTableSection
            logs={logs}
            onInspect={(entry) => setSelectedLog(entry)}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}