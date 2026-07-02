import { ArchiveItem } from '../types';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  User, 
  FileCheck2, 
  Layers, 
  Clock, 
  FileText,
  Bookmark
} from 'lucide-react';

interface DetailModalProps {
  item: ArchiveItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailModal({ item, isOpen, onClose }: DetailModalProps) {
  if (!isOpen || !item) return null;

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Surat Masuk': return 'bg-blue-500';
      case 'Surat Keluar': return 'bg-cyan-500';
      case 'Surat Keputusan (SK)': return 'bg-violet-500';
      case 'Dokumen Keuangan': return 'bg-emerald-500';
      case 'Dokumen Kepegawaian': return 'bg-amber-500';
      case 'Laporan Kegiatan': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  // Safe Google Drive Preview Embedded Link
  const drivePreviewUrl = item.fileDriveId && !item.fileDriveId.startsWith('offline-local-file-')
    ? `https://drive.google.com/file/d/${item.fileDriveId}/preview`
    : (item.fileDriveLink && item.fileDriveLink.startsWith('blob:') ? item.fileDriveLink : '');

  return (
    <div id="detail-modal-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="detail-modal-content"
        className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]"
      >
        {/* Left Side: Metadata Card */}
        <div className="w-full md:w-96 bg-slate-50 border-r border-slate-100 p-6 flex flex-col justify-between overflow-y-auto" id="detail-side-metadata">
          <div className="space-y-6">
            {/* Header / ID */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] px-2.5 py-1 text-white font-semibold rounded-full ${getCategoryColor(item.kategori)}`}>
                {item.kategori}
              </span>
              <button
                id="detail-modal-close-left"
                onClick={onClose}
                className="md:hidden p-1.5 hover:bg-slate-200 rounded-lg transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title / Number */}
            <div className="space-y-2">
              <h3 className="text-xl font-sans font-extrabold text-slate-900 tracking-tight leading-tight">
                {item.judul}
              </h3>
              <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-600 font-semibold bg-indigo-50/70 border border-indigo-100 py-1 px-2.5 rounded-lg w-max">
                <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                <span>No: {item.nomorArsip || '-'}</span>
              </div>
            </div>

            {/* List Attributes */}
            <div className="space-y-4 pt-4 border-t border-slate-200/60 text-sm">
              {/* Tanggal Dokumen */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tanggal Dokumen</p>
                  <p className="font-semibold text-slate-800">{item.tanggalArsip}</p>
                </div>
              </div>

              {/* Pengunggah */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Operator Pengarsip</p>
                  <p className="font-semibold text-slate-800 truncate" title={item.pengunggah}>{item.pengunggah || 'Sistem'}</p>
                </div>
              </div>

              {/* Tanggal Unggah */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tanggal Direkam</p>
                  <p className="font-mono text-xs text-slate-600">{item.tanggalUnggah || '-'}</p>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi / Detail Berkas</p>
                <div className="bg-white border border-slate-200/50 rounded-xl p-3 text-xs text-slate-600 max-h-36 overflow-y-auto leading-relaxed">
                  {item.deskripsi ? item.deskripsi : <em className="text-slate-400">Tidak ada deskripsi tambahan untuk arsip ini.</em>}
                </div>
              </div>
            </div>
          </div>

          {/* Drive link action */}
          <div className="pt-6 border-t border-slate-200/60 flex flex-col gap-2">
            {item.fileDriveLink && (
              <a
                id="detail-btn-open-drive"
                href={item.fileDriveLink}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl text-center text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Buka di Google Drive
              </a>
            )}
            <p className="text-[10px] text-slate-400 text-center">
              Arsip terunggah aman secara cloud.
            </p>
          </div>
        </div>

        {/* Right Side: Embedded Preview (Or Empty Illustration Preview) */}
        <div className="flex-1 bg-slate-100 flex flex-col" id="detail-main-preview">
          {/* Top Bar for Desktop */}
          <div className="bg-white border-b border-slate-100 py-3 px-6 hidden md:flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <FileCheck2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 truncate" title={item.fileDriveName}>
                {item.fileDriveName || item.judul}
              </span>
            </div>
            <button
              id="detail-modal-close-desktop"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Frame of Preview */}
          <div className="flex-1 relative" id="preview-iframe-box">
            {drivePreviewUrl ? (
              <iframe
                id="drive-preview-frame"
                src={drivePreviewUrl}
                className="absolute inset-0 w-full h-full border-0 bg-slate-100"
                allow="autoplay"
                title={`${item.judul} Preview`}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <FileText className="w-16 h-16 stroke-1 mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-800">Preview Tidak Tersedia</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Berkas Google Drive untuk arsip ini tidak memiliki ID valid atau tidak diizinkan di-render secara internal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
