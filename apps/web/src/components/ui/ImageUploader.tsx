'use client';

import { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: 'square' | 'video' | 'wide';
}

const ASPECTS: Record<NonNullable<ImageUploaderProps['aspect']>, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[16/7]',
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function ImageUploader({
  value,
  onChange,
  label = 'Upload Image',
  aspect = 'video',
}: ImageUploaderProps) {
  const { t } = useLanguage();

  const tr = (key: string, fallback: string): string => {
    const v = t(key as any);
    return v === key ? fallback : v;
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Quick client-side validation before hitting the API
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        tr('imageUploader.tooLargeTitle', 'Image too large'),
        tr(
          'imageUploader.tooLargeBody',
          'Please choose an image under 5 MB.',
        ),
      );
      return;
    }
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      toast.error(
        tr('imageUploader.badTypeTitle', 'Invalid file type'),
        tr(
          'imageUploader.badTypeBody',
          'Only JPG, PNG, WebP, or GIF are allowed.',
        ),
      );
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const token = getToken();
      // Use native fetch because our api client sets JSON headers
      const res = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Upload failed');
      }

      const data = await res.json();
      // Backend returns `/uploads/file-xxx.jpg` — prefix with API_URL
      // so it works when frontend and API run on different hosts
      const fullUrl = data.url.startsWith('http')
        ? data.url
        : `${API_URL}${data.url}`;

      onChange(fullUrl);
      toast.success(
        tr('imageUploader.successTitle', 'Image uploaded'),
        tr('imageUploader.successBody', 'Your image is ready to use.'),
      );
    } catch (err: any) {
      toast.error(
        tr('imageUploader.errorTitle', 'Upload failed'),
        err?.message ?? 'Something went wrong',
      );
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 transition-colors">
        {label}
      </label>

      {value ? (
        <div
          className={`relative w-full ${ASPECTS[aspect]} rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group`}
        >
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={tr('imageUploader.remove', 'Remove image')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          className="
            flex flex-col items-center justify-center
            w-full h-32
            border-2 border-dashed border-slate-300 dark:border-slate-700
            rounded-xl
            cursor-pointer
            hover:bg-slate-50 dark:hover:bg-slate-800/50
            transition-colors
          "
        >
          <div className="flex flex-col items-center justify-center">
            <UploadCloud
              className={`w-8 h-8 mb-2 ${
                isUploading
                  ? 'text-gold animate-bounce'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUploading
                ? tr('imageUploader.uploading', 'Uploading...')
                : tr('imageUploader.clickToUpload', 'Click to upload image')}
            </p>
            <p className="text-[0.65rem] text-slate-400 dark:text-slate-500 mt-1">
              {tr(
                'imageUploader.hint',
                'JPG, PNG, WebP — max 5 MB',
              )}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}