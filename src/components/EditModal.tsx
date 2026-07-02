import React, { useState, useEffect } from 'react';
import { ArchiveItem, ARCHIVE_CATEGORIES, ArchiveCategory } from '../types';
import { X, Loader2, Save, AlertCircle } from 'lucide-react';

interface EditModalProps {
  item: ArchiveItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ArchiveItem) => Promise<void>;
}

export default function EditModal({ item, isOpen, onClose, onSave }: EditModalProps) {
  const [nomorArsip, setNomorArsip] = useState('');
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<ArchiveCategory | ''>('');
  const [tanggalArsip, setTanggalArsip] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Sync state with open item
  useEffect(() => {
    if (item) {
      setNomorArsip(item.nomorArsip || '');
      setJudul(item.judul || '');
      setKategori(item.kategori as ArchiveCategory || '');
      setTanggalArsip(item.tanggalArsip || '');
      setDeskripsi(item.deskripsi || '');
      setErrorText(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (!nomorArsip || !judul || !kategori || !tanggalArsip) {
      setErrorText('Seluruh kolom bertanda bintang (*) wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const updatedItem: ArchiveItem = {
        ...item,
        nomorArsip,
        judul,
        kategori,
        tanggalArsip,
        deskripsi,
      };

      await onSave(updatedItem);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorText(`Gagal mengubah data: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="edit-modal-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="edit-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-sans font-bold text-slate-900">Perbarui Data Arsip</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">ID: {item.id.substring(0, 12)}...</p>
          </div>
          <button
            id="edit-modal-close"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 rounded-lg transition text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorText && (
            <div id="edit-modal-error" className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Judul Dokumen */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Judul Dokumen <span className="text-rose-500">*</span></label>
            <input
              id="edit-input-judul"
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition font-medium"
            />
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Kategori <span className="text-rose-500">*</span></label>
            <select
              id="edit-input-kategori"
              value={kategori}
              onChange={(e) => setKategori(e.target.value as ArchiveCategory)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
            >
              {ARCHIVE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Nomor Arsip */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Nomor Arsip <span className="text-rose-500">*</span></label>
            <input
              id="edit-input-nomor"
              type="text"
              value={nomorArsip}
              onChange={(e) => setNomorArsip(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition font-mono"
            />
          </div>

          {/* Tanggal Arsip */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Tanggal Dokumen <span className="text-rose-500">*</span></label>
            <input
              id="edit-input-tanggal"
              type="date"
              value={tanggalArsip}
              onChange={(e) => setTanggalArsip(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Deskripsi Tambahan</label>
            <textarea
              id="edit-input-deskripsi"
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
            />
          </div>

          <div className="pt-2 text-[10px] text-slate-400">
            Terakhir diunggah oleh Operator: <em className="font-medium text-slate-500">{item.pengunggah || 'Tidak diketahui'}</em> pada <span className="font-mono">{item.tanggalUnggah || '-'}</span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            id="edit-btn-cancel"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            id="edit-btn-save"
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Masih Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
