
export type PageView = 
  | 'dashboard' // Beranda
  | 'registration-hub' // Menu Pendaftaran
  | 'schedule-status' // Jadwal & Status
  | 'proposal' 
  | 'skripsi' 
  | 'revision-proposal' // New page for revision form
  | 'revision-skripsi'  // New page for revision form
  | 'history' 
  | 'admin-validation' 
  | 'admin-scheduling' 
  | 'admin-settings'
  | 'admin-reports' // New Report Page
  | 'library-admin'; 

export interface FileRequirement {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  acceptedTypes?: string;
}

export interface UploadedFile {
  file: File;
  previewUrl?: string;
  driveId?: string;
  driveUrl?: string;
}

export interface SubmissionState {
  [key: string]: UploadedFile | null;
}

export interface ValidationItem {
  isValid: boolean;
  notes?: string;
}

// Updated statuses for Manual Workflow
export type ApplicationStatus = 
  | 'pending'                   // Baru daftar, menunggu validasi berkas
  | 'rejected'                  // Berkas ditolak
  | 'validated'                 // Berkas valid, masuk antrian jadwal
  | 'scheduled'                 // Sudah dijadwalkan sidang/sempro
  | 'revision_proposal_pending' // Selesai Sempro -> Menunggu kumpul revisi manual
  | 'proposal_completed'        // Revisi Proposal Selesai -> Eligible Skripsi
  | 'revision_skripsi_pending'  // Selesai Sidang Skripsi -> Menunggu kumpul revisi manual
  | 'skripsi_completed';        // Revisi Skripsi Selesai -> Eligible Yudisium

export interface Submission {
  id: string;
  studentNpm: string;
  studentName: string;
  type: 'proposal' | 'skripsi';
  files: SubmissionState;
  validations: { [fileId: string]: ValidationItem }; 
  status: ApplicationStatus;
  submittedAt: Date;
  academicYear?: string;
}

export interface Schedule {
  id: string;
  submissionId: string;
  type: 'proposal' | 'skripsi';
  date: string;
  time: string;     // Start Time
  endTime: string;  // End Time
  room: string;
  studentName: string;
  title: string;
  pembimbing1: string;
  pembimbing2: string;
  penguji1: string;
  penguji2: string;
  status: 'upcoming' | 'completed'; // New field to track schedule completion
  academicYear?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Student {
  nama: string;
  npm: string;
  prodi: string;
  judul_skripsi: string;
  pembimbing_1: string;
  pembimbing_2: string;
  penguji_1: string;
  penguji_2: string;
}