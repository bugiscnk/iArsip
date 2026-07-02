import { useState, useEffect } from 'react';
import { ArchiveItem } from './types';
import { 
  googleSignIn, 
  restoreGoogleToken, 
  clearGoogleToken,
  OperatorUser 
} from './firebase';
import { 
  fetchArchives, 
  createArchiveEntry, 
  updateArchiveEntry, 
  deleteArchiveEntry, 
  uploadFileToDrive, 
  deleteFileFromDrive,
  setupWorkspace
} from './googleApi';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents imports
import Dashboard from './components/Dashboard';
import ArchiveList from './components/ArchiveList';
import UploadForm from './components/UploadForm';
import EditModal from './components/EditModal';
import DetailModal from './components/DetailModal';
import AuthScreen from './components/AuthScreen';
import OperatorManager from './components/OperatorManager';
import ConfirmModal from './components/ConfirmModal';

// Icons
import { 
  FolderLock, 
  ShieldCheck, 
  Database, 
  FileText, 
  UploadCloud, 
  LogOut, 
  RefreshCw, 
  HelpCircle,
  Menu,
  X,
  Sparkles,
  Inbox,
  Lock,
  UserCheck,
  ExternalLink
} from 'lucide-react';

export const defaultUser: OperatorUser = {
  id: 'default-operator',
  name: 'Operator Utama',
  email: 'bugisgptgc@gmail.com',
  role: 'admin',
  passwordHash: '',
  createdAt: new Date().toISOString()
};

const INITIAL_OFFLINE_ARCHIVES: ArchiveItem[] = [
  {
    id: 'ID-SMPL01',
    nomorArsip: '001/ARS/SM/VI/2026',
    judul: 'Surat Undangan Rapat Koordinasi Wilayah',
    kategori: 'Surat Masuk',
    deskripsi: 'Undangan koordinasi program kerja semester dua tahun anggaran 2026.',
    tanggalArsip: '2026-06-15',
    fileDriveId: 'sample-file-1',
    fileDriveLink: '#',
    fileDriveName: 'Undangan_Rakor_Wilayah_2026.pdf',
    pengunggah: 'bugisgptgc@gmail.com',
    tanggalUnggah: '15/06/2026, 09:00 WITA',
  },
  {
    id: 'ID-SMPL02',
    nomorArsip: '012/ARS/SK/V/2026',
    judul: 'Surat Keputusan Pengangkatan Panitia Arsip Mandiri',
    kategori: 'Surat Keputusan (SK)',
    deskripsi: 'SK struktur kepanitiaan pelaksana digitalisasi arsip sekretariat daerah.',
    tanggalArsip: '2026-05-20',
    fileDriveId: 'sample-file-2',
    fileDriveLink: '#',
    fileDriveName: 'SK_Panitia_Arsip_Digital.pdf',
    pengunggah: 'bugisgptgc@gmail.com',
    tanggalUnggah: '20/05/2026, 14:30 WITA',
  },
  {
    id: 'ID-SMPL03',
    nomorArsip: '045/ARS/KEU/IV/2026',
    judul: 'Laporan Realisasi Anggaran Triwulan I',
    kategori: 'Dokumen Keuangan',
    deskripsi: 'Laporan neraca keuangan dan realisasi pengeluaran operasional sekretariat triwulan pertama.',
    tanggalArsip: '2026-04-10',
    fileDriveId: 'sample-file-3',
    fileDriveLink: '#',
    fileDriveName: 'Laporan_Keuangan_Triwulan_I_2026.xlsx',
    pengunggah: 'bugisgptgc@gmail.com',
    tanggalUnggah: '10/04/2026, 11:15 WITA',
  }
];

export default function App() {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Authentication status
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<OperatorUser | null>(defaultUser);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Application data
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Layout states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'all' | 'upload' | 'operators'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal interactions
  const [editingItem, setEditingItem] = useState<ArchiveItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ArchiveItem | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }) => {
    setConfirmConfig({
      isOpen: true,
      ...config,
    });
  };

  // Global notifications (toasts)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Auto clear toast after 5s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
  };

  // Initialize and check operator custom session + Google tokens
  useEffect(() => {
    let currentUser = defaultUser;
    const savedUser = localStorage.getItem('operator_user_session');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as OperatorUser;
        currentUser = parsed;
      } catch (e) {
        console.warn('Gagal membaca sesi operator tersimpan, menggunakan default.');
      }
    }
    setUser(currentUser);
    setNeedsAuth(false);

    const token = restoreGoogleToken();
    if (token) {
      setAccessToken(token);
      loadArchives(token);
    } else {
      // Load offline archives if not connected
      const offlineData = localStorage.getItem('user_archives_offline');
      if (offlineData) {
        try {
          setArchives(JSON.parse(offlineData));
        } catch (err) {
          setArchives(INITIAL_OFFLINE_ARCHIVES);
        }
      } else {
        setArchives(INITIAL_OFFLINE_ARCHIVES);
        localStorage.setItem('user_archives_offline', JSON.stringify(INITIAL_OFFLINE_ARCHIVES));
      }
      triggerToast('info', 'Sesi kearsipan aktif dalam Mode Offline Lokal.');
    }
  }, []);

  // Fetch archives from Sheets
  const loadArchives = async (token: string) => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      // Auto-verify or create Google Drive Folder and Google Sheets Database
      await setupWorkspace(token);
      
      const data = await fetchArchives(token);
      setArchives(data);
    } catch (err: any) {
      console.error(err);
      setDataError(err.message || 'Gagal memuat basis data arsip dari Google Sheets.');
      triggerToast('error', 'Koneksi database Google Sheets bermasalah.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAuthSuccess = async (authenticatedUser: OperatorUser) => {
    setUser(authenticatedUser);
    setNeedsAuth(false);
    localStorage.setItem('operator_user_session', JSON.stringify(authenticatedUser));
    
    // Check if we already have Google token cached
    const token = restoreGoogleToken();
    if (token) {
      setAccessToken(token);
      await loadArchives(token);
    }
  };

  const handleConnectGoogle = async () => {
    setIsLoadingData(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setAccessToken(result.accessToken);
        triggerToast('success', 'Koneksi ke Google Drive & Sheets berhasil dihubungkan!');
        await loadArchives(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast('error', `Gagal menghubungkan Google Workspace: ${err.message || err}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = async () => {
    showConfirm({
      title: 'Putuskan Google Workspace?',
      message: 'Apakah Anda yakin ingin memutuskan koneksi Google Drive & Sheets serta membersihkan data lokal? Anda tidak perlu masuk log kembali untuk menggunakan dasbor ini.',
      confirmText: 'Ya, Putuskan Koneksi',
      cancelText: 'Batal',
      type: 'warning',
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setUser(defaultUser);
        setNeedsAuth(false);
        localStorage.removeItem('operator_user_session');
        clearGoogleToken();
        setAccessToken(null);
        setArchives([]);
        triggerToast('info', 'Koneksi Google Workspace berhasil diputuskan.');
      }
    });
  };

  // Handler: Secure multipart Upload file to Google Drive & metadata log in Sheets
  const handleUploadNewArchive = async (
    file: File, 
    metadata: {
      nomorArsip: string;
      judul: string;
      kategori: string;
      deskripsi: string;
      tanggalArsip: string;
    }
  ) => {
    // 2. Build the unique record
    const id = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const timestamp = new Date().toLocaleString('id-ID', { timeZoneName: 'short' });

    let simulatedLink = '#';
    try {
      simulatedLink = URL.createObjectURL(file);
    } catch (e) {
      console.warn('Gagal membuat object URL untuk berkas lokal');
    }

    const newItem: ArchiveItem = {
      id,
      nomorArsip: metadata.nomorArsip,
      judul: metadata.judul,
      kategori: metadata.kategori,
      deskripsi: metadata.deskripsi,
      tanggalArsip: metadata.tanggalArsip,
      fileDriveId: 'offline-local-file-' + id,
      fileDriveLink: simulatedLink,
      fileDriveName: file.name,
      pengunggah: user?.email || 'bugisgptgc@gmail.com',
      tanggalUnggah: timestamp,
    };

    if (!accessToken) {
      // Offline mode saving
      const updatedArchives = [newItem, ...archives];
      setArchives(updatedArchives);
      localStorage.setItem('user_archives_offline', JSON.stringify(updatedArchives));
      setActiveTab('all');
      triggerToast('success', 'Arsip berhasil disimpan secara offline lokal di browser.');
      return;
    }

    try {
      // 1. Upload the physical document file to Drive
      const uploadResult = await uploadFileToDrive(accessToken, file);

      // Overwrite with real Google Drive details
      newItem.fileDriveId = uploadResult.fileId;
      newItem.fileDriveLink = uploadResult.fileLink;

      // 3. Save entry row to Google Spreadsheet
      await createArchiveEntry(accessToken, newItem);

      // Update local state reactive stack
      setArchives(prev => [newItem, ...prev]);
      setActiveTab('all');
      triggerToast('success', 'Sukses mengarsipkan surat dan mengunggah dokumen baru!');
    } catch (error: any) {
      console.error('Upload process failed:', error);
      throw error;
    }
  };

  // Handler: Save modifications to sheets
  const handleSaveEdit = async (updatedItem: ArchiveItem) => {
    if (!accessToken) {
      // Offline mode editing
      const updatedArchives = archives.map(item => item.id === updatedItem.id ? updatedItem : item);
      setArchives(updatedArchives);
      localStorage.setItem('user_archives_offline', JSON.stringify(updatedArchives));
      triggerToast('success', 'Data arsip berhasil diperbarui secara lokal.');
      return;
    }
    try {
      await updateArchiveEntry(accessToken, updatedItem);
      // Reactive state modification
      setArchives(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      triggerToast('success', 'Data arsip berhasil diperbarui di Google Sheets.');
    } catch (error: any) {
      console.error(error);
      triggerToast('error', `Gagal mengubah rekaman: ${error.message}`);
      throw error;
    }
  };

  // Handler: Delete record and file with strict confirm
  const handleDeleteArchive = async (itemId: string, fileDriveId: string) => {
    const findItem = archives.find(item => item.id === itemId);
    const itemTitle = findItem ? `'${findItem.judul}'` : 'arsip ini';

    showConfirm({
      title: 'Hapus Arsip Digital?',
      message: `Apakah Anda yakin ingin menghapus arsip ${itemTitle}? Tindakan ini akan menghapus rekaman secara permanen.` + (!accessToken ? '' : ' & memindahkan berkas di Google Drive ke tempat sampah.'),
      confirmText: 'Ya, Hapus Permanen',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsLoadingData(true);
        try {
          if (!accessToken) {
            // Offline mode deletion
            const updatedArchives = archives.filter(item => item.id !== itemId);
            setArchives(updatedArchives);
            localStorage.setItem('user_archives_offline', JSON.stringify(updatedArchives));
            triggerToast('success', 'Arsip berhasil dihapus secara lokal.');
            return;
          }

          // 1. Delete Sheets Entry Row
          await deleteArchiveEntry(accessToken, itemId);

          // 2. Trash Drive File (send to trash/bin)
          if (fileDriveId && !fileDriveId.startsWith('offline-local-file-')) {
            await deleteFileFromDrive(accessToken, fileDriveId);
          }

          // Reactive update
          setArchives(prev => prev.filter(item => item.id !== itemId));
          triggerToast('success', 'Arsip dan berkas Google Drive terkait berhasil terhapus.');
        } catch (error: any) {
          console.error(error);
          triggerToast('error', `Gagal menghapus arsip: ${error.message}`);
        } finally {
          setIsLoadingData(false);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between" id="arsip-digital-app-root">
      
      {isIframe && (
        <div id="iframe-unblock-bar" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs py-2 px-4 font-semibold text-center flex flex-col sm:flex-row items-center justify-center gap-2 relative z-50 shadow-xs border-b border-amber-600/20">
          <span>⚠️ <strong>Sesi Pratinjau Terdeteksi:</strong> Browser web memblokir jendela pop-up otorisasi akun Google di dalam iframe ini. Buka aplikasi secara langsung di tab baru agar koneksi berjalan 100% lancar.</span>
          <a 
            href={window.location.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white text-amber-850 hover:bg-slate-50 py-0.5 px-2.5 rounded-lg transition font-bold shadow-xs inline-flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
          </a>
        </div>
      )}
      
      {/* Notifications banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm max-w-sm flex items-center gap-3 font-medium ${
              toast.type === 'success' 
                ? 'bg-emerald-950 text-emerald-100 border-emerald-900' 
                : toast.type === 'error'
                  ? 'bg-rose-950 text-rose-100 border-rose-900'
                  : 'bg-slate-900 text-slate-100 border-slate-800'
            }`}
          >
            <div className="flex-1 whitespace-pre-wrap">{toast.text}</div>
            <button id="toast-close" onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 text-xs py-0.5 px-2 bg-white/10 rounded">Tutup</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER LOGIN IF NEEDS AUTH */}
      {needsAuth ? (
        <AuthScreen onAuthSuccess={handleAuthSuccess} triggerToast={triggerToast} />
      ) : (
        /* RENDER SYSTEM IF AUTHENTICATED */
        <div id="workspace-main-dashboard" className="flex flex-col min-h-screen">
          
          {/* Header Bar */}
          <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs" id="app-header">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                
                {/* Brand Logo & Name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
                    <FolderLock className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="font-sans font-black text-slate-900 tracking-tight text-lg flex items-center gap-1.5">
                      ARSIP DIGITAL
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium font-mono hidden sm:block">Database: Sheet ID: 19tho4...wjRQDSIT</p>
                  </div>
                </div>

                {/* Navigation menu for Desktop */}
                <nav className="hidden md:flex space-x-1" id="desktop-nav">
                  <button
                    id="nav-tab-dashboard"
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activeTab === 'dashboard' 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Ringkasan
                  </button>
                  <button
                    id="nav-tab-all"
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activeTab === 'all' 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Daftar Arsip
                  </button>
                  <button
                    id="nav-tab-upload"
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activeTab === 'upload' 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Unggah Arsip
                  </button>
                  <button
                    id="nav-tab-operators"
                    onClick={() => setActiveTab('operators')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activeTab === 'operators' 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Kelola Operator
                  </button>
                </nav>

                {/* User Session Info / Logout */}
                <div className="hidden md:flex items-center gap-4" id="header-user-block">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-mono">Operator</div>
                    <div className="text-sm font-bold text-slate-700 truncate max-w-[180px]" title={user?.email || 'bugisgptgc@gmail.com'}>
                      {user?.email || 'bugisgptgc@gmail.com'}
                    </div>
                  </div>
                  <button
                    id="btn-header-logout"
                    onClick={handleLogout}
                    className="p-2 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-xl text-slate-500 transition cursor-pointer"
                    title="Keluar Sesi"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Mobile Menu Buttons */}
                <div className="md:hidden flex items-center gap-2" id="mobile-header-menu">
                  <button
                    id="btn-mobile-sync"
                    onClick={() => loadArchives(accessToken!)}
                    disabled={isLoadingData}
                    className="p-2 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    id="btn-mobile-menu-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
                    title="Menu Navigasi"
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>

              </div>
            </div>

            {/* Mobile Dropdown Navigation */}
            {isMobileMenuOpen && (
              <motion.div 
                id="mobile-drawer"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2.5 shadow-md flex flex-col"
              >
                <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono">OPERATOR SAAT INI</div>
                  <div className="text-xs font-bold text-slate-700 truncate">{user?.email || 'bugisgptgc@gmail.com'}</div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    id="nav-tab-m-dashboard"
                    onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                    className={`w-full py-2.5 px-4 text-left rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2.5 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                  >
                    📊 Dashboard
                  </button>
                  <button
                    id="nav-tab-m-all"
                    onClick={() => { setActiveTab('all'); setIsMobileMenuOpen(false); }}
                    className={`w-full py-2.5 px-4 text-left rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2.5 ${activeTab === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                  >
                    📂 Daftar Arsip
                  </button>
                  <button
                    id="nav-tab-m-upload"
                    onClick={() => { setActiveTab('upload'); setIsMobileMenuOpen(false); }}
                    className={`w-full py-2.5 px-4 text-left rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2.5 ${activeTab === 'upload' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                  >
                    📤 Unggah Arsip
                  </button>
                  <button
                    id="nav-tab-m-operators"
                    onClick={() => { setActiveTab('operators'); setIsMobileMenuOpen(false); }}
                    className={`w-full py-2.5 px-4 text-left rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2.5 ${activeTab === 'operators' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                  >
                    👥 Kelola Operator
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    id="btn-mobile-logout"
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="w-full py-2.5 px-4 text-left rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 border border-rose-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar Sesi / Tutup
                  </button>
                </div>
              </motion.div>
            )}
          </header>

          {/* MAIN CONTAINER CONTENT */}
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main-body">
            
            {/* Header info & Synchronize button row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6" id="app-navigation-subbar">
              <div>
                <h2 className="text-xl font-sans font-extrabold tracking-tight text-slate-900" id="section-title">
                  {activeTab === 'dashboard' && 'Dashboard Analisis'}
                  {activeTab === 'all' && 'Arsip Digital Terdaftar'}
                  {activeTab === 'upload' && 'Simpan & Arsipkan Dokumen'}
                  {activeTab === 'operators' && 'Manajemen Operator Cloud'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeTab === 'dashboard' && 'Ringkasan statistik dan distribusi file digital secara komprehensif.'}
                  {activeTab === 'all' && 'Kelola, sunting, pratinjau, atau hapus rekaman arsip terintegrasi.'}
                  {activeTab === 'upload' && 'Mendaftarkan berkas baru ke database terintegrasi.'}
                  {activeTab === 'operators' && 'Kelola hak akses operator, audit petugas, dan daftarkan user baru.'}
                </p>
              </div>

              <div className="flex items-center gap-2" id="dashboard-actions-row">
                <button
                  id="btn-sync-databases"
                  onClick={() => accessToken ? loadArchives(accessToken) : handleConnectGoogle()}
                  disabled={isLoadingData}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                  title="Sinkronisasi Ulang Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                  {isLoadingData ? 'Menyinkronkan...' : 'Sinkronkan Data'}
                </button>
              </div>
            </div>

            {/* Google Workspace Connection prompt banner */}
            {!accessToken && (
              <div id="google-connection-warning" className="p-5 rounded-2xl bg-amber-50 border border-amber-200/60 shadow-xs space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 flex-wrap">
                        <span>Google Workspace Belum Terhubung</span>
                        {isIframe && <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase font-mono">Iframe Pop-up Terbatas</span>}
                      </h4>
                      <p className="text-xs text-amber-700/90 leading-relaxed">
                        Sesi kearsipan saat ini bersifat offline lokal. Hubungkan akun Google Anda untuk membaca, memodifikasi basis data Google Sheets & mengunggah berkas penunjang secara langsung ke Google Drive.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {isIframe && (
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white hover:bg-slate-100 text-amber-700 border border-amber-250 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Buka di Tab Baru
                      </a>
                    )}
                    <button
                      id="btn-connect-workspace-cta"
                      onClick={handleConnectGoogle}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Hubungkan Google Workspace
                    </button>
                  </div>
                </div>

                {isIframe ? (
                  <div className="bg-amber-100/50 border border-amber-200/50 p-4 rounded-xl text-xs text-amber-850 space-y-1">
                    <p className="font-bold flex items-center gap-1 text-amber-900">
                      ℹ️ Penjelasan Mengapa Terkunci:
                    </p>
                    <p className="opacity-90 leading-relaxed text-amber-800">
                      Sistem tampilan halaman sandboxed virtual seperti AI Studio atau iframe melarang pemuatan popup otentikasi Google secara langsung. <strong>Solusi resmi & termudah:</strong> klik tombol <strong>"Buka di Tab Baru"</strong> di atas. Setelah terbuka penuh di tab mandiri peramban Anda, hubungkan akun Google Drive & Sheets Anda dengan sekali klik. Sistem akan mengingat sesi Anda!
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-100/45 border border-amber-200/50 p-4 rounded-xl text-xs text-amber-900/90 space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950">
                      💡 Panduan Mengatasi Gagal Koneksi di GitHub Pages & Vercel:
                    </p>
                    <p className="leading-relaxed text-amber-800">
                      Otentikasi pop-up Google OAuth (Firebase Auth) membutuhkan otorisasi origin domain. Jika Anda melihat pesan error atau tombol tidak merespons setelah rilis di GitHub atau Vercel:
                    </p>
                    <ul className="list-decimal pl-4 space-y-1 text-amber-800 font-medium">
                      <li>Masuk ke <strong>Firebase Console</strong> Anda &rarr; Pilih Proyek &rarr; Masuk ke menu <strong>Authentication</strong> &rarr; pilih tab <strong>Settings</strong> &rarr; pilih <strong>Authorized domains</strong>.</li>
                      <li>Tambahkan domain situs rilis Anda, contohnya: <code>username.github.io</code> atau <code>nama-aplikasi.vercel.app</code> ke dalam daftar domain tepercaya tersebut.</li>
                      <li>Daftarkan juga domain tersebut sebagai <em>Authorized JavaScript origins</em> di <strong>Google Cloud Console &rarr; APIs & Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs</strong> milik Anda agar API token Google dapat diterbitkan dengan aman.</li>
                    </ul>
                    <p className="text-[11px] text-amber-700/80 italic pt-1 border-t border-amber-200/30">
                      * Catatan: Selama Google Workspace belum terhubung, dasbor ini tetap fungsional dalam <strong>Mode Offline Lokal</strong>. Data arsip yang Anda unggah, sunting, atau hapus akan otomatis disimpan di penyimpanan lokal browser Anda!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error alerts if Sheets fails to fetch */}
            {dataError && (
              <div id="data-load-error-alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm flex items-start gap-3.5 text-sm text-rose-800 mb-6">
                <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-bold">Gagal sinkronisasi data dari Google Sheets</p>
                  <p className="text-xs opacity-90 leading-relaxed">
                    Kesalahan terjadi saat memanggil endpoint spreadsheets API. Kemungkinan penyebab: template spreadsheet belum divalidasi, koneksi lambat, atau izin scope tidak diizinkan penuh.
                  </p>
                  <button
                    id="btn-retry-auth"
                    onClick={() => handleConnectGoogle()}
                    className="mt-2 text-xs font-semibold underline hover:text-rose-950 block"
                  >
                    Klik di sini untuk otoritas ulang & coba lagi
                  </button>
                </div>
              </div>
            )}

            {/* Core Section renders depending on Active Tab */}
            {isLoadingData && archives.length === 0 ? (
              <div id="big-loading-wrapper" className="py-24 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700">Menghubungkan ke Sheets & Drive API...</p>
                  <p className="text-xs text-slate-400">Sedang menyinkronkan daftar database arsip Anda secara langsung.</p>
                </div>
              </div>
            ) : (
              <div id="section-views-wrapper">
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    archives={archives} 
                    onNavigate={(tab) => {
                      setActiveTab(tab);
                      window.scrollTo(0, 0);
                    }}
                    onViewArchive={(item) => setViewingItem(item)}
                  />
                )}
                {activeTab === 'all' && (
                  <ArchiveList 
                    archives={archives}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(itemId, fileDriveId) => handleDeleteArchive(itemId, fileDriveId)}
                    onView={(item) => setViewingItem(item)}
                  />
                )}
                {activeTab === 'upload' && (
                  <UploadForm 
                    onUpload={handleUploadNewArchive}
                    uploaderEmail={user?.email || 'bugisgptgc@gmail.com'}
                    isOffline={!accessToken}
                  />
                )}
                {activeTab === 'operators' && (
                  <OperatorManager 
                    currentUser={user!}
                    triggerToast={triggerToast}
                  />
                )}
              </div>
            )}

          </main>

          {/* Footer view */}
          <footer className="bg-white border-t border-slate-200 py-6" id="app-footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5" id="footer-logo">
                <FolderLock className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-slate-500">Dasbor Arsip Digital Org</span>
              </div>
              <div id="footer-status-pills" className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-end text-[11px]">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${accessToken ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                  {accessToken ? 'Google Drive Terkoneksi (Folder: 1NHjhUx...)' : 'Google Drive Terputus'}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${accessToken ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                  {accessToken ? 'Sheets DB Terkoneksi' : 'Sheets DB Terputus'}
                </span>
              </div>
              <div>
                © 2026 • Dirancang oleh AI App Builder Profesional
              </div>
            </div>
          </footer>

          {/* Detail viewer popup dialog modal */}
          <DetailModal 
            item={viewingItem}
            isOpen={viewingItem !== null}
            onClose={() => setViewingItem(null)}
          />

          {/* Edit record popup dialog modal */}
          <EditModal 
            item={editingItem}
            isOpen={editingItem !== null}
            onClose={() => setEditingItem(null)}
            onSave={handleSaveEdit}
          />

          {/* Custom confirmation popup dialog modal */}
          <ConfirmModal
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmText={confirmConfig.confirmText}
            cancelText={confirmConfig.cancelText}
            type={confirmConfig.type}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          />

        </div>
      )}

    </div>
  );
}
