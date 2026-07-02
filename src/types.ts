export interface ArchiveItem {
  id: string;
  nomorArsip: string;
  judul: string;
  kategori: string;
  deskripsi: string;
  tanggalArsip: string;
  fileDriveId: string;
  fileDriveLink: string;
  fileDriveName: string;
  pengunggah: string;
  tanggalUnggah: string;
}

export type ArchiveCategory = 
  | 'Surat Masuk'
  | 'Surat Keluar'
  | 'Surat Keputusan (SK)'
  | 'Dokumen Keuangan'
  | 'Dokumen Kepegawaian'
  | 'Laporan Kegiatan'
  | 'Dokumen Lainnya';

export const ARCHIVE_CATEGORIES: ArchiveCategory[] = [
  'Surat Masuk',
  'Surat Keluar',
  'Surat Keputusan (SK)',
  'Dokumen Keuangan',
  'Dokumen Kepegawaian',
  'Laporan Kegiatan',
  'Dokumen Lainnya'
];

export interface DashboardStats {
  totalDocs: number;
  byCategory: Record<string, number>;
  recentUploads: ArchiveItem[];
}
