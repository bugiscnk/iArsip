import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ARCHIVE_CATEGORIES, ArchiveCategory } from '../types';
import { 
  Upload, 
  File, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  X,
  ArrowRight,
  Database
} from 'lucide-react';

interface UploadFormProps {
  onUpload: (
    file: File, 
    metadata: {
      nomorArsip: string;
      judul: string;
      kategori: string;
      deskripsi: string;
      tanggalArsip: string;
    }
  ) => Promise<void>;
  uploaderEmail: string;
  isOffline?: boolean;
}

export default function UploadForm({ onUpload, uploaderEmail, isOffline = false }: UploadFormProps) {
  // Form values
  const [nomorArsip, setNomorArsip] = useState('');
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<ArchiveCategory | ''>('');
  const [tanggalArsip, setTanggalArsip] = useState(new Date().toISOString().split('T')[0]);
  const [deskripsi, setDeskripsi] = useState('');
  
  // File attachments state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate a recommendation for Archival Number based on Category and Date
  const handleAutoSuggestNomor = (cat: string) => {
    if (!cat) return;
    const year = tanggalArsip ? tanggalArsip.split('-')[0] : new Date().getFullYear();
    const month = tanggalArsip ? tanggalArsip.split('-')[1] : '01';
    
    let suffix = 'OTHERS';
    if (cat === 'Surat Masuk') suffix = 'SRT-MASUK';
    else if (cat === 'Surat Keluar') suffix = 'SRT-KELUAR';
    else if (cat === 'Surat Keputusan (SK)') suffix = 'SK-DIR';
    else if (cat === 'Dokumen Keuangan') suffix = 'KEU';
    else if (cat === 'Dokumen Kepegawaian') suffix = 'PEG';
    else if (cat === 'Laporan Kegiatan') suffix = 'LPN';

    const randNum = Math.floor(100 + Math.random() * 900);
    setNomorArsip(`${randNum}/ARS/${suffix}/${month}/${year}`);
  };

  // Drag and Drop handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      // Auto fill title if empty
      if (!judul) {
        // Strip file extension to make clean doc title
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setJudul(cleanName);
      }
    }
  };

  // File Selector Change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!judul) {
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setJudul(cleanName);
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedFile) {
      setStatusMessage({ type: 'error', text: 'Silakan pilih atau jatuhkan dokumen (file) terlebih dahulu.' });
      return;
    }

    if (!nomorArsip || !judul || !kategori || !tanggalArsip) {
      setStatusMessage({ type: 'error', text: 'Silakan lengkapi seluruh kolom wajib yang bertanda bintang (*).' });
      return;
    }

    setIsLoading(true);
    try {
      await onUpload(selectedFile, {
        nomorArsip,
        judul,
        kategori,
        deskripsi,
        tanggalArsip,
      });

      setStatusMessage({
        type: 'success',
        text: 'Alhamdulillah! Berkas sukses diunggah ke Google Drive dan data dicatat di Google Sheets.',
      });

      // Clear form
      setNomorArsip('');
      setJudul('');
      setKategori('');
      setDeskripsi('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        type: 'error',
        text: `Gagal menyelesaikan pengarsipan: ${error.message || error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="upload-form-container" className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Form Header info */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between" id="upload-form-header">
        <div>
          <h2 className="text-lg font-sans font-bold text-slate-900">Unggah & Arsipkan Dokumen</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOffline 
              ? 'Arsip akan disimpan sementara secara offline lokal pada memori peramban Anda.' 
              : 'File akan diunggah ke Google Drive dan log data disimpan di Google Sheets.'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Database className={`w-4 h-4 ${isOffline ? 'text-amber-500' : 'text-indigo-500'}`} />
          <span>{isOffline ? 'Mode Offline Lokal' : 'Sheet Database Terkoneksi'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6" id="upload-forms-element">
        {/* Banner Status */}
        {statusMessage && (
          <div 
            id="upload-status-banner"
            className={`p-4 rounded-xl flex items-start gap-3 border text-sm ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{statusMessage.type === 'success' ? 'Sukses' : 'Kendala Terjadi'}</p>
              <p className="mt-0.5 text-xs">{statusMessage.text}</p>
            </div>
            <button 
              id="upload-status-close"
              type="button" 
              onClick={() => setStatusMessage(null)} 
              className="ml-auto p-1 hover:bg-slate-100/10 rounded"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}

        {/* Drag and Drop Region */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Berkas Dokumen <span className="text-rose-500">*</span></label>
          
          {!selectedFile ? (
            <div
              id="drag-drop-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl py-10 px-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragActive 
                  ? 'border-indigo-500 bg-indigo-50/50' 
                  : 'border-slate-200 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="*/*"
              />
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                <Upload className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Klik untuk unggah atau seret file ke sini
                </p>
                <p className="text-xs text-slate-400">
                  Mendukung semua format dokumen (PDF, JPG, Docx, XLSX, dll.)
                </p>
              </div>
            </div>
          ) : (
            <div id="file-selected-info" className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
                <File className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">
                  Ukuran: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Tipe: {selectedFile.type || 'Dokumen'}
                </p>
              </div>
              <button
                id="btn-remove-file"
                type="button"
                onClick={removeSelectedFile}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Batalkan File"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Other Inputs split layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="form-metadata-fields">
          {/* Judul Dokumen */}
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Judul Dokumen <span className="text-rose-500">*</span></label>
            <input
              id="input-judul"
              type="text"
              placeholder="Contoh: Surat Edaran Kegiatan Halal Bihalal"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
            />
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Kategori Arsip <span className="text-rose-500">*</span></label>
            <select
              id="input-kategori"
              value={kategori}
              onChange={(e) => {
                const cat = e.target.value as ArchiveCategory;
                setKategori(cat);
                handleAutoSuggestNomor(cat);
              }}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
            >
              <option value="">-- Pilih Kategori --</option>
              {ARCHIVE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Nomor Arsip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">Nomor Arsip <span className="text-rose-500">*</span></label>
              {kategori && (
                <button
                  id="btn-generate-nomor"
                  type="button"
                  onClick={() => handleAutoSuggestNomor(kategori)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  Acak Nomor Baru
                </button>
              )}
            </div>
            <input
              id="input-nomor"
              type="text"
              placeholder="Contoh: 125/ARS/SK-DIR/06/2026"
              value={nomorArsip}
              onChange={(e) => setNomorArsip(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition font-mono"
            />
          </div>

          {/* Tanggal Arsip */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Tanggal Dokumen / Arsip <span className="text-rose-500">*</span></label>
            <input
              id="input-tanggal"
              type="date"
              value={tanggalArsip}
              onChange={(e) => setTanggalArsip(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
            />
          </div>

          {/* Pengunggah (Email info) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Operator Pengarsip</label>
            <input
              id="input-uploader-email"
              type="text"
              value={uploaderEmail}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
            />
          </div>

          {/* Deskripsi */}
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Deskripsi / Detail Tambahan</label>
            <textarea
              id="input-deskripsi"
              rows={3}
              placeholder="Tuliskan keterangan detail isi berkas, ringkasan perihal, atau catatan penting..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
            />
          </div>
        </div>

        {/* Action button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end" id="upload-actions-container">
          <button
            id="btn-submit-upload"
            type="submit"
            disabled={isLoading || !selectedFile}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-8 rounded-xl transition duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 speed-fast animate-spin text-white" />
                Mendistribusikan ke Google Cloud...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Daftarkan Arsip Digital
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
