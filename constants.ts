
import { FileRequirement } from './types';

export const PROPOSAL_REQUIREMENTS: FileRequirement[] = [
  { id: 'sk_pembimbing', label: 'Upload SK Pembimbing', required: true, description: 'Surat Keputusan penetapan dosen pembimbing.' },
  { id: 'draft_proposal', label: 'Draft Proposal', required: true, acceptedTypes: '.pdf,.doc,.docx' },
  { id: 'turnitin', label: 'Hasil Cek Plagiat', required: true, description: 'Maksimal 30%, Dicek menggunakan TURNITIN.' },
  { id: 'logbook', label: 'Bukti Logbook Konsultasi', required: true, description: 'Min. 4x bimbingan masing-masing pembimbing 1 & 2.' },
  { id: 'seminar_proof', label: 'Bukti Mengikuti Seminar', required: true, description: 'Bukti sudah mengikuti minimal 2x Seminar.' },
  { id: 'opponent_proof', label: 'Bukti Sebagai Penyanggah', required: true },
  { id: 'references', label: 'Jurnal Referensi', required: true, description: 'Jurnal utama yang digunakan dalam proposal.' },
  { id: 'payment', label: 'Bukti Lunas Pembayaran', required: true },
];

export const SKRIPSI_REQUIREMENTS: FileRequirement[] = [
  { id: 'draft_skripsi', label: 'Draft Skripsi', required: true, acceptedTypes: '.pdf,.doc,.docx' },
  { id: 'sk_pembimbing', label: 'Upload SK Pembimbing', required: true },
  { id: 'sk_penguji', label: 'Upload SK Penguji', required: true },
  { id: 'logbook_bimbingan', label: 'Logbook Bimbingan', required: true, description: '4x Pembimbing 1 dan 4x Pembimbing 2.' },
  { id: 'logbook_penelitian', label: 'Logbook Pelaksanaan Penelitian', required: true },
  { id: 'transkrip', label: 'Transkrip Sementara', required: true },
  { id: 'izin_penelitian', label: 'Surat Ijin Penelitian', required: true },
  { id: 'balasan_penelitian', label: 'Surat Balasan Penelitian', required: true, description: 'Dari instansi/tempat sampel/lab.' },
  { id: 'bebas_admin', label: 'Keterangan Bebas Administrasi', required: true, description: 'Akademik, Keuangan, dan Laboratorium.' },
  { id: 'payment_seminar', label: 'Bukti Lunas Pembayaran Seminar', required: true },
  { id: 'cert_ospek', label: 'Scan Sertifikat OSPEK', required: true },
  { id: 'cert_toefl', label: 'Scan Sertifikat TOEFL', required: true },
  { id: 'cert_esq', label: 'Scan Sertifikat ESQ', required: true },
  { id: 'turnitin_final', label: 'Hasil Cek Plagiat Final', required: true, description: 'Maksimal 30%.' },
];

// REVISI: Mahasiswa upload 3 hal. Hardcopy dicek manual oleh Admin Pustaka.
export const PROPOSAL_REVISION_REQUIREMENTS: FileRequirement[] = [
    { id: 'ppt_sempro', label: 'File Presentasi (PPT)', required: true, acceptedTypes: '.ppt,.pptx,.pdf', description: 'Materi presentasi saat seminar.' },
    { id: 'lembar_pengesahan', label: 'Scan Lembar Pengesahan', required: true, acceptedTypes: '.pdf,.jpg', description: 'Yang telah ditandatangani Pembimbing & Penguji.' },
    { id: 'abstrak', label: 'File Abstrak', required: true, acceptedTypes: '.doc,.docx,.pdf', description: 'Abstrak hasil perbaikan.' },
];

export const SKRIPSI_REVISION_REQUIREMENTS: FileRequirement[] = [
    { id: 'ppt_sidang', label: 'File Presentasi (PPT) Sidang', required: true, acceptedTypes: '.ppt,.pptx,.pdf' },
    { id: 'lembar_pengesahan_skripsi', label: 'Scan Lembar Pengesahan Skripsi', required: true, acceptedTypes: '.pdf,.jpg', description: 'Full Tanda Tangan Basah/Digital.' },
    { id: 'abstrak_final', label: 'File Abstrak Final', required: true, acceptedTypes: '.doc,.docx,.pdf' },
    // Hardcopy Skripsi is checked manually by Library Admin
];

export const SYSTEM_INSTRUCTION = `
Anda adalah asisten akademik virtual yang membantu mahasiswa dalam proses pendaftaran Seminar Proposal dan Sidang Skripsi.
Gunakan informasi berikut sebagai acuan utama:

Alur Pendaftaran:
1. Daftar Proposal -> Validasi Admin -> Dijadwalkan -> Sidang/Seminar -> Lulus -> Upload Revisi -> Validasi Pustaka -> Selesai.
2. Daftar Skripsi (Hanya jika Revisi Proposal Selesai) -> Validasi -> Dijadwalkan -> Sidang -> Lulus -> Upload Revisi -> Validasi Pustaka -> Yudisium.

Syarat Pendaftaran Seminar Proposal:
1. Upload SK Pembimbing
2. Draft Proposal
3. Hasil Cek Plagiat (Maks 30%, TURNITIN)
4. Bukti Logbook konsultasi (4x bimbingan Pembimbing 1 & 2)
5. Bukti mengikuti 2x Seminar
6. Bukti sebagai penyanggah
7. Jurnal Referensi
8. Bukti lunas pembayaran

Syarat Pendaftaran Sidang Skripsi:
1. Draft Skripsi
2. Upload SK Pembimbing
3. Upload SK Penguji
4. Logbook Bimbingan (4x Pembimbing 1 & 2)
5. Logbook pelaksanaan penelitian
6. Transkrip Sementara
7. Surat Ijin Penelitian
8. Surat balasan persetujuan penelitian
9. Keterangan bebas administrasi (Akademik, Keuangan, Lab)
10. Bukti Lunas Pembayaran Seminar
11. Scan Sertifikat OSPEK
12. Scan Sertifikat TOEFL
13. Scan Sertifikat ESQ
14. Hasil Cek Plagiat (Maks 30%)

Syarat Revisi (Diserahkan ke Admin Pustaka):
1. Hardcopy (Dicek Fisik)
2. Upload PPT
3. Upload Scan Lembar Pengesahan
4. Upload Abstrak

Jawablah pertanyaan mahasiswa dengan ramah, jelas, dan menyemangati.
`;
