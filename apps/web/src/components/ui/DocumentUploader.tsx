'use client';

import { useRef, useState } from 'react';
import {
  UploadCloud,
  X,
  Loader2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { KycDocument, KycDocType } from '@/lib/organizerApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface DocumentUploaderProps {
  docType: KycDocType;
  label: string;
  value: KycDocument[];
  onChange: (docs: KycDocument[]) => void;
  required?: boolean;
  hint?: string;
  accept?: string;
}

const DOC_LABELS: Record<KycDocType, string> = {
  BUSINESS_PERMIT: 'Business Permit',
  NATIONAL_ID: 'National ID',
  OTHER: 'Other Document',
};

export function DocumentUploader({
  docType,
  label,
  value,
  onChange,
  required = false,
  hint,
  accept = 'image/jpeg,image/png,image/webp,image/gif,application/pdf',
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const myDocs = value.filter((d) => d.type === docType);
  const hasDoc = myDocs.length > 0;
  const missingRequired = required && !hasDoc;

  const handleFile = async (file: File) => {
    const isImage = /^image\/(jpeg|png|webp|gif)$/.test(file.type);
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      return toast.error(
        'Invalid file',
        'Only JPG, PNG, WebP, GIF, or PDF allowed.',
      );
    }
    if (isImage && file.size > 5 * 1024 * 1024) {
      return toast.error('Too large', 'Image must be under 5 MB.');
    }
    if (isPdf && file.size > 10 * 1024 * 1024) {
      return toast.error('Too large', 'PDF must be under 10 MB.');
    }

    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Upload failed');
      }

      const data = await res.json();
      const url = data.url.startsWith('http')
        ? data.url
        : `${API_URL}${data.url}`;

      const newDoc: KycDocument = {
        type: docType,
        url,
        fileName: file.name,
      };

      onChange([...value, newDoc]);
      toast.success('Uploaded', `${DOC_LABELS[docType]} saved.`);
    } catch (err: any) {
      toast.error('Upload failed', err?.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeDoc = (url: string) => {
    onChange(value.filter((d) => d.url !== url));
  };

  const formatSize = (url: string) => {
    // We don't have file size after upload, so just show type
    return url.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Image';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {hasDoc && (
          <span className="text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Uploaded
          </span>
        )}
      </div>

      {hint && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {hint}
        </p>
      )}

      {/* Uploaded files list */}
      {hasDoc && (
        <ul className="space-y-2 mb-3">
          {myDocs.map((doc) => {
            const isPdf = doc.url.toLowerCase().endsWith('.pdf');
            return (
              <li
                key={doc.url}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 group"
              >
                {isPdf ? (
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                    <img
                      src={doc.url}
                      alt={doc.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                    {formatSize(doc.url)}
                  </p>
                </div>

                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-slate-400 hover:text-gold hover:bg-gold/10 transition-colors"
                  title="View"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => removeDoc(doc.url)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Drop zone — hidden when uploaded (replace instead) */}
      {!hasDoc && (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            uploading
              ? 'border-gold bg-gold/5'
              : missingRequired
              ? 'border-red-300 dark:border-red-800 hover:border-red-400'
              : 'border-slate-300 dark:border-slate-600 hover:border-gold'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Uploading...
              </p>
              <div className="w-32 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-brand-gradient transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Click to upload
              </p>
              <p className="text-[0.65rem] text-slate-400">
                JPG, PNG, WebP, GIF, or PDF
              </p>
            </>
          )}
        </div>
      )}

      {/* Missing required warning */}
      {missingRequired && !uploading && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {label} is required
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}
