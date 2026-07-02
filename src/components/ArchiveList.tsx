import { useState } from 'react';
import { ArchiveItem, ARCHIVE_CATEGORIES } from '../types';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Eye, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  FileCheck2,
  Calendar,
  Layers,
  Inbox
} from 'lucide-react';
import { motion } from 'motion/react';

interface ArchiveListProps {
  archives: ArchiveItem[];
  onEdit: (item: ArchiveItem) => void;
  onDelete: (itemId: string, fileDriveId: string) => void;
  onView: (item: ArchiveItem) => void;
}

export default function ArchiveList({ archives, onEdit, onDelete, onView }: ArchiveListProps) {
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [sortField, setSortField] = useState<'tanggalArsip' | 'judul' | 'tanggalUnggah'>('tanggalUnggah');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter & Search formulation
  const filteredArchives = archives.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      item.judul.toLowerCase().includes(query) ||
      item.nomorArsip.toLowerCase().includes(query) ||
      item.deskripsi.toLowerCase().includes(query) ||
      item.pengunggah.toLowerCase().includes(query);

    const matchCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory;

    return matchSearch && matchCategory;
  });

  // Sorting formulation
  const sortedArchives = [...filteredArchives].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'tanggalArsip') {
      comparison = new Date(a.tanggalArsip || 0).getTime() - new Date(b.tanggalArsip || 0).getTime();
    } else if (sortField === 'tanggalUnggah') {
      comparison = new Date(a.tanggalUnggah || 0).getTime() - new Date(b.tanggalUnggah || 0).getTime();
    } else {
      comparison = a.judul.localeCompare(b.judul);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Pagination compilation
  const totalItems = sortedArchives.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArchives = sortedArchives.slice(startIndex, startIndex + itemsPerPage);

  const toggleSort = (field: 'tanggalArsip' | 'judul' | 'tanggalUnggah') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setSortField('tanggalUnggah');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Surat Masuk': return 'bg-blue-50 bg-blue-100 text-blue-800 border-blue-200';
      case 'Surat Keluar': return 'bg-cyan-50 bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Surat Keputusan (SK)': return 'bg-violet-50 bg-violet-100 text-violet-800 border-violet-200';
      case 'Dokumen Keuangan': return 'bg-emerald-50 bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Dokumen Kepegawaian': return 'bg-amber-50 bg-amber-100 text-amber-800 border-amber-200';
      case 'Laporan Kegiatan': return 'bg-rose-50 bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-50 bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div id="archive-list-container" className="space-y-6">
      {/* Filters Card */}
      <div id="filter-panel" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="search-input"
              type="text"
              placeholder="Cari berdasarkan judul, nomor arsip, deskripsi..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition duration-150"
            />
          </div>

          {/* Category filter */}
          <div className="w-full md:w-64">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Filter className="w-4 h-4" />
              </span>
              <select
                id="category-filter-select"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition duration-150 appearance-none bg-white font-medium text-slate-700"
              >
                <option value="Semua">Semua Kategori</option>
                {ARCHIVE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick select tags & filter status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-50 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Ditemukan: <strong>{totalItems}</strong> dari <strong>{archives.length}</strong> total arsip</span>
            {(searchQuery || selectedCategory !== 'Semua') && (
              <button
                id="btn-clear-filters"
                onClick={clearFilters}
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline decoration-dotted"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Sorters buttons as toggle tags */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Urutkan:</span>
            <button
              id="sort-btn-upload-date"
              onClick={() => toggleSort('tanggalUnggah')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                sortField === 'tanggalUnggah' 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tanggal Unggah {sortField === 'tanggalUnggah' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              id="sort-btn-archive-date"
              onClick={() => toggleSort('tanggalArsip')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                sortField === 'tanggalArsip' 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tanggal Dokumen {sortField === 'tanggalArsip' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              id="sort-btn-title"
              onClick={() => toggleSort('judul')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                sortField === 'judul' 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Nama Dokumen {sortField === 'judul' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>

      {/* Archives Display */}
      {paginatedArchives.length === 0 ? (
        <div id="empty-search-state" className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 px-4 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Inbox className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-base font-sans font-bold text-slate-800">Arsip tidak ditemukan</h3>
          <p className="text-slate-400 max-w-md mx-auto text-sm mt-1">
            {archives.length === 0 
              ? 'Mulai dengan mengarsipkan dokumen pertama Anda di menu "Unggah Arsip"!'
              : 'Tidak ada arsip yang cocok dengan pencarian Anda. Silakan coba kata kunci lain atau ubah filter.'
            }
          </p>
          {(searchQuery || selectedCategory !== 'Semua') && (
            <button
              id="empty-btn-clear"
              onClick={clearFilters}
              className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-2 px-4 rounded-xl transition duration-150 cursor-pointer"
            >
              Hapus Semua Filter
            </button>
          )}
        </div>
      ) : (
        <div id="archives-grid" className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hidden md:block">
            {/* Table layout for Desktop */}
            <table className="w-full text-left border-collapse" id="desktop-archives-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Identitas & Nomor</th>
                  <th className="py-4 px-3">Judul / Nama Dokumen</th>
                  <th className="py-4 px-3">Kategori</th>
                  <th className="py-4 px-3">Tanggal Dokumen</th>
                  <th className="py-4 px-3">Pengunggah</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700" id="desktop-archives-table-body">
                {paginatedArchives.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition duration-150 group">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.nomorArsip || 'TIDAK ADA NOMOR'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {item.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition truncate max-w-xs" title={item.judul}>
                        {item.judul}
                      </div>
                      {item.fileDriveName ? (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-xs">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{item.fileDriveName}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`text-xs border px-2.5 py-0.5 rounded-full font-medium ${getCategoryColor(item.kategori)}`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-slate-600 whitespace-nowrap">
                      {item.tanggalArsip}
                    </td>
                    <td className="py-4 px-3 text-slate-500 max-w-[140px] truncate" title={item.pengunggah}>
                      <div className="truncate font-sans font-medium">{item.pengunggah}</div>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          id={`btn-view-${item.id}`}
                          onClick={() => onView(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.fileDriveLink ? (
                          <a
                            id={`link-drive-${item.id}`}
                            href={item.fileDriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition inline-flex items-center justify-center"
                            title="Buka di Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : null}
                        <button
                          id={`btn-edit-${item.id}`}
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Ubah Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-${item.id}`}
                          onClick={() => onDelete(item.id, item.fileDriveId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Arsip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards format for Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden" id="mobile-archives-grid">
            {paginatedArchives.map((item) => (
              <div 
                id={`mobile-card-${item.id}`}
                key={item.id} 
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition duration-150"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {item.nomorArsip}
                    </span>
                    <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${getCategoryColor(item.kategori)}`}>
                      {item.kategori}
                    </span>
                  </div>
                  
                  <h4 className="font-sans font-bold text-slate-900 leading-snug line-clamp-2">
                    {item.judul}
                  </h4>
                  
                  <div className="space-y-1 pt-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Dokumen: {item.tanggalArsip}</span>
                    </div>
                    {item.pengunggah && (
                      <div className="truncate">Pengunggah: <strong className="font-medium">{item.pengunggah}</strong></div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {item.id.slice(0, 8)}...</span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-view-m-${item.id}`}
                      onClick={() => onView(item)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </button>
                    {item.fileDriveLink && (
                      <a
                        id={`link-drive-m-${item.id}`}
                        href={item.fileDriveLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition inline-flex"
                      >
                        <ExternalLink className="w-4.5 h-4.5" />
                      </a>
                    )}
                    <button
                      id={`btn-edit-m-${item.id}`}
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      id={`btn-delete-m-${item.id}`}
                      onClick={() => onDelete(item.id, item.fileDriveId)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div id="pagination-controls" className="flex items-center justify-between pt-4 pb-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Menampilkan <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> dari <strong>{totalItems}</strong> arsip
          </p>
          <div className="flex items-center gap-1">
            <button
              id="pagination-btn-prev"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition duration-150 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-4 text-slate-700">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              id="pagination-btn-next"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition duration-150 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
