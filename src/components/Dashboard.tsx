import { ArchiveItem, ARCHIVE_CATEGORIES } from '../types';
import { motion } from 'motion/react';
import { 
  FileText, 
  FolderOpen, 
  TrendingUp, 
  Calendar, 
  User, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';

interface DashboardProps {
  archives: ArchiveItem[];
  onNavigate: (tab: 'all' | 'upload') => void;
  onViewArchive: (archive: ArchiveItem) => void;
}

export default function Dashboard({ archives, onNavigate, onViewArchive }: DashboardProps) {
  // Statistics compilation
  const totalCount = archives.length;
  
  // Group by category
  const categoryCounts = ARCHIVE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<string, number>);

  archives.forEach(item => {
    if (categoryCounts[item.kategori] !== undefined) {
      categoryCounts[item.kategori]++;
    } else {
      categoryCounts['Dokumen Lainnya'] = (categoryCounts['Dokumen Lainnya'] || 0) + 1;
    }
  });

  // Sort categories by highest count
  const sortedCategories = ARCHIVE_CATEGORIES.map(cat => ({
    name: cat,
    count: categoryCounts[cat],
    percentage: totalCount > 0 ? Math.round((categoryCounts[cat] / totalCount) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  // Get recent uploads (up to 5)
  const recentUploads = [...archives]
    .sort((a, b) => new Date(b.tanggalUnggah || b.tanggalArsip).getTime() - new Date(a.tanggalUnggah || a.tanggalArsip).getTime())
    .slice(0, 5);

  // Quick stat highlights
  const mainStats = [
    {
      id: 'kpi-total',
      title: 'Total Arsip Digital',
      val: totalCount,
      desc: 'Arsip tersimpan di Google Sheets & Drive',
      icon: FolderOpen,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-indigo-600'
    },
    {
      id: 'kpi-recent',
      title: 'Arsip Baru (Bulan Ini)',
      val: archives.filter(item => {
        const itemDate = new Date(item.tanggalArsip || item.tanggalUnggah);
        const now = new Date();
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      }).length,
      desc: 'Dokumen diarsipkan bulan berjalan',
      icon: TrendingUp,
      color: 'from-emerald-400 to-teal-600',
      textColor: 'text-teal-600'
    },
    {
      id: 'kpi-most-active',
      title: 'Kategori Terbanyak',
      val: sortedCategories[0]?.count || 0,
      desc: sortedCategories[0]?.name || 'Belum ada data',
      icon: FileText,
      color: 'from-amber-400 to-orange-500',
      textColor: 'text-orange-500'
    }
  ];

  // Helper to assign colors to categories
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

  return (
    <div className="space-y-8" id="dashboard-tab-content">
      {/* Welcome Banner */}
      <div className="bg-slate-950 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-slate-950/10 border border-slate-900" id="dashboard-welcome">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-indigo-500/20 text-indigo-300 font-mono text-xs px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">
            Sistem Arsip Terintegrasi
          </span>
          <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight mt-4">
            Dasbor Pengelolaan Arsip Digital
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Platform modern untuk menyimpan, melacak, dan mengelola rekam arsip organisasi Anda.
            Seluruh data fisik otomatis terunggah ke Google Drive dan tercatat di Google Sheets.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              id="dash-btn-upload"
              onClick={() => onNavigate('upload')}
              className="bg-white hover:bg-slate-100 text-slate-950 font-medium py-2.5 px-5 rounded-xl transition duration-150 flex items-center gap-2 text-sm shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Unggah Arsip Baru
            </button>
            <button 
              id="dash-btn-view"
              onClick={() => onNavigate('all')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium py-2.5 px-5 rounded-xl transition duration-150 flex items-center gap-2 text-sm cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              Telusuri Semua Arsip
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-stats-grid">
        {mainStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              id={stat.id}
              key={stat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-3xl font-sans font-bold text-slate-900 mt-2">{stat.val}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{stat.desc}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Split visual: Left (Distribution Chart), Right (Recent Archives) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="dashboard-main-sections">
        {/* Distribution Chart / Progress Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-5" id="dashboard-distribution">
          <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-indigo-500" />
            Distribusi Arsip Per Kategori
          </h2>
          
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center" id="empty-distribution-state">
              <FolderOpen className="w-12 h-12 stroke-1 mb-3 text-slate-300" />
              <p className="text-sm">Belum ada data arsip terekam.</p>
              <p className="text-xs text-slate-400">Unggah file pertama Anda untuk melihat distribusi.</p>
            </div>
          ) : (
            <div className="space-y-5" id="distribution-progress-bars">
              {sortedCategories.map((cat, idx) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="font-mono text-slate-500 font-semibold">
                      {cat.count} arsip ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${getCategoryColor(cat.name)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.05 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Uploads Feed */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-7" id="dashboard-recent-feed">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Arsip Terbaru Diunggah
            </h2>
            {totalCount > 5 && (
              <button 
                id="dash-btn-see-all-recent"
                onClick={() => onNavigate('all')}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua ({totalCount})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentUploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center" id="empty-recent-state">
              <Clock className="w-12 h-12 stroke-1 mb-3 text-slate-300" />
              <p className="text-sm">Belum ada riwayat aktivitas unggah.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100" id="recent-uploads-list">
              {recentUploads.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(item.kategori)} bg-opacity-10 text-slate-700 border-l-2 ${getCategoryColor(item.kategori)}`}>
                        {item.kategori}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {item.nomorArsip || '-'}
                      </span>
                    </div>
                    <h4 className="text-sm font-sans font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition duration-150">
                      {item.judul}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.tanggalArsip}
                      </span>
                      {item.pengunggah && (
                        <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-none">
                          <User className="w-3.5 h-3.5" />
                          {item.pengunggah}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.fileDriveLink ? (
                      <a 
                        id={`recent-link-${item.id}`}
                        href={item.fileDriveLink} 
                        target="_blank" 
                        rel="noreferrer noopener"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition duration-150"
                        title="Buka di Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : null}
                    <button
                      id={`recent-detail-${item.id}`}
                      onClick={() => onViewArchive(item)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs py-1.5 px-3 rounded-lg font-medium transition duration-150 cursor-pointer"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
