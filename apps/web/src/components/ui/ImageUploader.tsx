'use client';

import { useRef, useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  if (file.type === 'image/gif' || file.size < 300 * 1024) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function ImageUploader({ value, onChange, label = 'Upload Image' }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) return toast.error('Invalid file type', 'Only JPG, PNG, WebP allowed.');
    if (file.size > 15 * 1024 * 1024) return toast.error('Too large', 'Max 15 MB.');

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onChange(data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {label && <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>}
      {value ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')} className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-gold transition-colors">
          {uploading ? <Loader2 className="w-6 h-6 text-gold animate-spin" /> : <UploadCloud className="w-6 h-6 text-slate-400" />}
          <p className="text-xs text-slate-500">{uploading ? 'Uploading...' : 'Click to upload'}</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
    </div>
  );
}
