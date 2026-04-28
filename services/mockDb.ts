
import { Submission, Schedule, FileRequirement } from '../types';
import { PROPOSAL_REQUIREMENTS, SKRIPSI_REQUIREMENTS, PROPOSAL_REVISION_REQUIREMENTS, SKRIPSI_REVISION_REQUIREMENTS } from '../constants';
import { supabase } from './supabase';
import { getAllStudents } from './studentService';

// This simulates a backend database with Persistence
class MockDatabase {
  private submissions: Submission[] = [];
  private schedules: Schedule[] = [];
  private rooms: string[] = ['R. Sidang 1', 'R. Sidang 2', 'Lab Komputer 1', 'R. Seminar A'];
  
  private proposalRequirements: FileRequirement[] = [...PROPOSAL_REQUIREMENTS];
  private skripsiRequirements: FileRequirement[] = [...SKRIPSI_REQUIREMENTS];
  private proposalRevisionRequirements: FileRequirement[] = [...PROPOSAL_REVISION_REQUIREMENTS];
  private skripsiRevisionRequirements: FileRequirement[] = [...SKRIPSI_REVISION_REQUIREMENTS];

  private activeYear: string = "2024/2025";
  private STORAGE_KEY_SUBMISSIONS = 'app_submissions';
  private STORAGE_KEY_SCHEDULES = 'app_schedules';
  private STORAGE_KEY_ROOMS = 'app_rooms';

  constructor() {
      this.loadFromStorage();
  }

  // --- Persistence Logic ---
  private loadFromStorage() {
      if (typeof window !== 'undefined') {
          const storedSubs = localStorage.getItem(this.STORAGE_KEY_SUBMISSIONS);
          const storedScheds = localStorage.getItem(this.STORAGE_KEY_SCHEDULES);
          const storedRooms = localStorage.getItem(this.STORAGE_KEY_ROOMS);
          if (storedSubs) this.submissions = JSON.parse(storedSubs);
          if (storedScheds) this.schedules = JSON.parse(storedScheds);
          if (storedRooms) this.rooms = JSON.parse(storedRooms);
      }
  }

  private saveToStorage() {
      if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY_SUBMISSIONS, JSON.stringify(this.submissions));
          localStorage.setItem(this.STORAGE_KEY_SCHEDULES, JSON.stringify(this.schedules));
          localStorage.setItem(this.STORAGE_KEY_ROOMS, JSON.stringify(this.rooms));
      }
  }

  // --- UNDO / SNAPSHOT FEATURES ---
  getProcessSnapshot() {
      return {
          submissions: JSON.parse(JSON.stringify(this.submissions)),
          schedules: JSON.parse(JSON.stringify(this.schedules))
      };
  }

  async restoreProcessSnapshot(snapshot: { submissions: Submission[], schedules: Schedule[] }): Promise<void> {
      this.submissions = snapshot.submissions;
      this.schedules = snapshot.schedules;
      this.saveToStorage();
      
      // Sync Supabase if active (Basic wipe and replace logic for demo)
      if (supabase) {
          // Complex sync logic skipped for demo simplicity, assuming LocalStorage is primary for current session
      }
      return new Promise(resolve => setTimeout(resolve, 500));
  }

  // --- RESET SYSTEM FOR DEMO ---
  async resetProcessData(): Promise<void> {
      // Clears only submissions and schedules. Keeps Master Data (Students) intact.
      this.submissions = [];
      this.schedules = [];
      this.saveToStorage();

      if (supabase) {
          // Note: In a real Supabase scenario, you'd need RLS policies allowing delete
          await supabase.from('submissions').delete().neq('id', '0'); // Delete all
          await supabase.from('schedules').delete().neq('id', '0');   // Delete all
      }
      
      // Artificial delay for UI feedback
      return new Promise(resolve => setTimeout(resolve, 500));
  }

  getActiveYear() {
      return this.activeYear;
  }

  // --- Requirements Management (Sync for UI speed) ---
  async getRequirements(type: 'proposal' | 'skripsi'): Promise<FileRequirement[]> {
      if (supabase) {
          const { data, error } = await supabase.from('settings').select('value').eq('key', `req_${type}`).single();
          if (!error && data && data.value) {
              if (type === 'proposal') this.proposalRequirements = data.value;
              else this.skripsiRequirements = data.value;
          }
      }
      return type === 'proposal' ? this.proposalRequirements : this.skripsiRequirements;
  }

  async updateRequirements(type: 'proposal' | 'skripsi', newReqs: FileRequirement[]): Promise<void> {
      if (type === 'proposal') this.proposalRequirements = newReqs;
      else this.skripsiRequirements = newReqs;
      
      if (supabase) {
          const { error } = await supabase.from('settings').upsert({ key: `req_${type}`, value: newReqs });
          if (error) {
              console.error("Supabase Update Req Error:", error);
              alert("Gagal menyimpan pengaturan syarat ke Supabase: " + error.message);
          }
      }
  }

  async getRevisionRequirements(type: 'proposal' | 'skripsi'): Promise<FileRequirement[]> {
      if (supabase) {
          const { data, error } = await supabase.from('settings').select('value').eq('key', `revision_req_${type}`).single();
          if (!error && data && data.value) {
              if (type === 'proposal') this.proposalRevisionRequirements = data.value;
              else this.skripsiRevisionRequirements = data.value;
          }
      }
      return type === 'proposal' ? this.proposalRevisionRequirements : this.skripsiRevisionRequirements;
  }

  async updateRevisionRequirements(type: 'proposal' | 'skripsi', newReqs: FileRequirement[]): Promise<void> {
      if (type === 'proposal') this.proposalRevisionRequirements = newReqs;
      else this.skripsiRevisionRequirements = newReqs;
      
      if (supabase) {
          const { error } = await supabase.from('settings').upsert({ key: `revision_req_${type}`, value: newReqs });
          if (error) {
              console.error("Supabase Update Revision Req Error:", error);
              alert("Gagal menyimpan pengaturan syarat revisi ke Supabase: " + error.message);
          }
      }
  }

  async getRooms(): Promise<string[]> {
      if (supabase) {
          const { data, error } = await supabase.from('rooms').select('name');
          if (!error && data) {
              this.rooms = data.map(d => d.name);
              return this.rooms;
          }
      }
      return new Promise(resolve => setTimeout(() => resolve([...this.rooms]), 300));
  }
  
  async addRoom(roomName: string): Promise<void> {
      if (!this.rooms.includes(roomName)) {
          this.rooms.push(roomName);
          this.saveToStorage();
          
          if (supabase) {
              const { error } = await supabase.from('rooms').insert({ name: roomName });
              if (error) {
                  console.error("Supabase Insert Room Error:", error);
                  alert("Gagal menyimpan ruangan ke Supabase: " + error.message);
              }
          }
      }
  }

  async deleteRoom(roomName: string): Promise<void> {
      this.rooms = this.rooms.filter(r => r !== roomName);
      this.saveToStorage();
      
      if (supabase) {
          const { error } = await supabase.from('rooms').delete().eq('name', roomName);
          if (error) {
              console.error("Supabase Delete Room Error:", error);
              alert("Gagal menghapus ruangan di Supabase: " + error.message);
          }
      }
  }

  // --- ASYNC DATA OPERATIONS ---

  // 1. GET SUBMISSIONS
  async getSubmissions(): Promise<Submission[]> {
      // 1. Try Supabase if connected
      if (supabase) {
          const { data, error } = await supabase.from('submissions').select('*');
          if (error) {
              console.error("Supabase fetch error:", error);
          } else if (data) {
              // Always return Supabase data if connected, even if empty, 
              // so it doesn't confusingly fall back to local storage.
              this.submissions = data as unknown as Submission[];
              return this.submissions; 
          }
      }
      
      // 2. Fallback to Local Storage (Simulated Async)
      return new Promise((resolve) => {
          setTimeout(() => resolve([...this.submissions]), 300);
      });
  }

  async getSubmissionByNpm(npm: string, type: 'proposal' | 'skripsi'): Promise<Submission | undefined> {
      const all = await this.getSubmissions();
      return all.find(s => s.studentNpm === npm && s.type === type);
  }

  // 2. ADD / UPDATE SUBMISSION
  async addSubmission(submission: Submission): Promise<void> {
      // Update Local
      const existingIndex = this.submissions.findIndex(s => s.id === submission.id);
      if (existingIndex >= 0) {
        this.submissions[existingIndex] = submission;
      } else {
        this.submissions.push(submission);
      }
      this.saveToStorage();

      // Update Supabase
      if (supabase) {
          // Sanitize files to remove non-serializable JS File objects before sending to Supabase
          const cleanSubmission = { ...submission };
          const cleanFiles: any = {};
          if (cleanSubmission.files) {
              Object.keys(cleanSubmission.files).forEach(key => {
                  const fileData = cleanSubmission.files[key];
                  cleanFiles[key] = {
                      driveId: fileData?.driveId,
                      driveUrl: fileData?.driveUrl,
                      name: fileData?.file?.name || fileData?.name || 'Berkas Tersimpan'
                  };
              });
          }
          cleanSubmission.files = cleanFiles;

          const { error } = await supabase.from('submissions').upsert(cleanSubmission);
          if (error) {
              console.error("Supabase Error:", error);
              alert("Gagal menyimpan ke Supabase: " + error.message + "\nPastikan RLS (Row Level Security) di tabel 'submissions' sudah di-disable atau di-configure.");
          }
      }
  }

  async submitRevision(submissionId: string, files: Submission['files']): Promise<void> {
      const sub = this.submissions.find(s => s.id === submissionId);
      if (sub) {
        sub.files = { ...sub.files, ...files };
        sub.validations = {}; 
        this.saveToStorage();

        if (supabase) {
             const cleanFiles: any = {};
             if (sub.files) {
                 Object.keys(sub.files).forEach(key => {
                     const fileData = sub.files[key];
                     cleanFiles[key] = {
                         driveId: fileData?.driveId,
                         driveUrl: fileData?.driveUrl,
                         name: fileData?.file?.name || fileData?.name || 'Berkas Tersimpan'
                     };
                 });
             }
             const { error } = await supabase.from('submissions').update({ files: cleanFiles, validations: {} }).eq('id', submissionId);
             if (error) {
                 console.error("Supabase Error:", error);
                 alert("Gagal menyimpan revisi ke Supabase: " + error.message);
             }
        }
      }
  }

  // 3. VALIDATION
  async validateFile(submissionId: string, fileId: string, isValid: boolean, notes: string = ''): Promise<void> {
    // Pastikan data terbaru dari Supabase sudah ada di local cache
    await this.getSubmissions();
    
    const sub = this.submissions.find(s => s.id === submissionId);
    if (sub) {
      if (!sub.validations) sub.validations = {};
      sub.validations[fileId] = { isValid, notes };
      
      const isRevisionContext = sub.status.includes('revision');
      
      if (!isRevisionContext) {
          const requirements = sub.type === 'proposal' ? this.proposalRequirements : this.skripsiRequirements;
          const anyRejected = Object.values(sub.validations).some(v => v.isValid === false);
          const allRequiredValidated = requirements
            .filter(req => req.required)
            .every(req => sub.validations[req.id]?.isValid === true);

          if (anyRejected) sub.status = 'rejected';
          else if (allRequiredValidated) sub.status = 'validated';
          else sub.status = 'pending';
      }
      this.saveToStorage();

      if (supabase) {
          const { error } = await supabase.from('submissions').update({ validations: sub.validations, status: sub.status }).eq('id', submissionId);
          if (error) {
              console.error("Supabase Error:", error);
              alert("Gagal memvalidasi di Supabase: " + error.message);
          }
      }
    }
  }

  async resetFileValidation(submissionId: string, fileId: string): Promise<void> {
    await this.getSubmissions();
    const sub = this.submissions.find(s => s.id === submissionId);
    if (sub) {
      if (!sub.validations) sub.validations = {};
      delete sub.validations[fileId];
      if (!sub.status.includes('revision') && !sub.status.includes('completed')) {
          sub.status = 'pending'; 
      }
      this.saveToStorage();

      if (supabase) {
          const { error } = await supabase.from('submissions').update({ validations: sub.validations, status: sub.status }).eq('id', submissionId);
          if (error) {
              console.error("Supabase Error:", error);
              alert("Gagal mereset validasi di Supabase: " + error.message);
          }
      }
    }
  }

  async finalizeRevision(submissionId: string): Promise<void> {
      const sub = this.submissions.find(s => s.id === submissionId);
      if (sub) {
          if (sub.status === 'revision_proposal_pending') sub.status = 'proposal_completed'; 
          else if (sub.status === 'revision_skripsi_pending') sub.status = 'skripsi_completed';
          this.saveToStorage();

          if (supabase) {
              await supabase.from('submissions').update({ status: sub.status }).eq('id', submissionId);
          }
      }
  }

  // 4. SCHEDULES
  async getSchedules(): Promise<Schedule[]> {
      let rawSchedules = [...this.schedules];
      if (supabase) {
          const { data, error } = await supabase.from('schedules').select('*');
          if (error) {
              console.error("Supabase fetch schedules error:", error);
          } else if (data) {
              this.schedules = data as Schedule[];
              rawSchedules = this.schedules;
          }
      }
      
      const students = await getAllStudents();
      const allSubs = await this.getSubmissions();
      
      // Patch with the latest real-time student configuration (pembimbing and penguji)
      const patchedSchedules = rawSchedules.map(sch => {
          let pembimbing1 = sch.pembimbing1;
          let pembimbing2 = sch.pembimbing2;
          let penguji1 = sch.penguji1;
          let penguji2 = sch.penguji2;
          let title = sch.title;
          
          const sub = allSubs.find(s => s.id === sch.submissionId);
          let student = null;

          if (sub) {
              student = students.find(s => String(s.npm).trim().toLowerCase() === String(sub.studentNpm).trim().toLowerCase());
              if (!student) {
                  student = students.find(s => String(s.nama).trim().toLowerCase() === String(sub.studentName).trim().toLowerCase());
              }
          }
          
          // Absolute fallback if sub lookup fails entirely
          if (!student) {
              student = students.find(s => String(s.nama).trim().toLowerCase() === String(sch.studentName).trim().toLowerCase());
          }
          
          if (student) {
              // Only patch if the student's entry isn't obviously empty/falsy/dash
              const isValidVal = (val: any) => val && String(val).trim() !== "" && String(val).trim().toLowerCase() !== "-";

              const getAnyProp = (obj: any, keys: string[]) => {
                  for (const k of keys) {
                      if (isValidVal(obj[k])) return obj[k];
                  }
                  return null;
              };

              const validP1 = getAnyProp(student, ['pembimbing_1', 'pembimbing1', 'p1', 'Pembimbing 1']);
              if (validP1) pembimbing1 = validP1;

              const validP2 = getAnyProp(student, ['pembimbing_2', 'pembimbing2', 'p2', 'Pembimbing 2']);
              if (validP2) pembimbing2 = validP2;

              const validU1 = getAnyProp(student, ['penguji_1', 'penguji1', 'u1', 'Penguji 1']);
              if (validU1) penguji1 = validU1;

              const validU2 = getAnyProp(student, ['penguji_2', 'penguji2', 'u2', 'Penguji 2']);
              if (validU2) penguji2 = validU2;

              const validTitle = getAnyProp(student, ['judul_skripsi', 'judulskripsi', 'judul', 'title', 'Judul Skripsi']);
              if (validTitle) title = validTitle;
          }
          
          return {
              ...sch,
              pembimbing1,
              pembimbing2,
              penguji1,
              penguji2,
              title
          };
      });
      
      return patchedSchedules;
  }

  async getUpcomingSchedules(days: number = 3): Promise<Schedule[]> {
      const all = await this.getSchedules();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);

      return all.filter(s => {
        if (s.status === 'completed') return false;
        const sDate = new Date(s.date);
        return sDate >= today && sDate <= futureDate;
      }).sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }

  async addSchedule(schedule: Schedule): Promise<void> {
      this.schedules.push(schedule);
      const sub = this.submissions.find(s => s.id === schedule.submissionId);
      if (sub) sub.status = 'scheduled';
      this.saveToStorage();

      if (supabase) {
          const cleanSchedule = { ...schedule } as any;
          delete cleanSchedule.academicYear;

          const { error: schedError } = await supabase.from('schedules').insert(cleanSchedule);
          if (schedError) {
              console.error("Supabase Insert Schedule Error:", schedError);
              alert("Gagal menyimpan jadwal ke Supabase: " + schedError.message);
          }
          const { error: subError } = await supabase.from('submissions').update({ status: 'scheduled' }).eq('id', schedule.submissionId);
          if (subError) console.error("Supabase Update Submission Error:", subError);
      }
  }

  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<void> {
      const schedule = this.schedules.find(s => s.id === scheduleId);
      if (!schedule) return;

      Object.assign(schedule, updates);
      this.saveToStorage();

      if (supabase) {
          const cleanUpdates = { ...updates } as any;
          delete cleanUpdates.academicYear;

          const { error } = await supabase.from('schedules').update(cleanUpdates).eq('id', scheduleId);
          if (error) {
              console.error("Supabase Update Schedule Error:", error);
              alert("Gagal mengupdate jadwal ke Supabase: " + error.message);
          }
      }
  }

  async completeSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    schedule.status = 'completed';
    const sub = this.submissions.find(s => s.id === schedule.submissionId);
    if (sub) {
        sub.status = sub.type === 'proposal' ? 'revision_proposal_pending' : 'revision_skripsi_pending';
    }
    this.saveToStorage();

    if (supabase) {
        await supabase.from('schedules').update({ status: 'completed' }).eq('id', scheduleId);
        if (sub) await supabase.from('submissions').update({ status: sub.status }).eq('id', sub.id);
    }
  }

  async deleteSchedule(scheduleId: string, reason: string): Promise<void> {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    this.schedules = this.schedules.filter(s => s.id !== scheduleId);
    const sub = this.submissions.find(s => s.id === schedule.submissionId);
    if (sub) {
      sub.status = 'rejected';
      const firstKey = Object.keys(sub.files)[0];
      if (firstKey) {
        sub.validations[firstKey] = { 
            isValid: false, 
            notes: `STATUS DIRESET ADMIN: ${reason}. Silakan daftar ulang/perbaiki berkas.` 
        };
      }
    }
    this.saveToStorage();

    if (supabase) {
        await supabase.from('schedules').delete().eq('id', scheduleId);
        if (sub) await supabase.from('submissions').update({ status: 'rejected', validations: sub.validations }).eq('id', sub.id);
    }
  }

  // 5. CONFLICT CHECK (Must check against Latest Data)
  private timeToMinutes(time: string): number {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
  }

  async checkConflict(newSchedule: Schedule): Promise<string | null> {
    // FORCE FRESH FETCH for accuracy
    const latestSchedules = await this.getSchedules();

    const newStart = this.timeToMinutes(newSchedule.time);
    const newEnd = this.timeToMinutes(newSchedule.endTime);

    const newPeople = [newSchedule.pembimbing1, newSchedule.pembimbing2, newSchedule.penguji1, newSchedule.penguji2]
        .map(p => p.trim())
        .filter(p => p && p !== '-' && p.toLowerCase() !== 'dosen p1' && p.toLowerCase() !== 'dosen p2'); 

    for (const s of latestSchedules) {
        if (s.id === newSchedule.id) continue;
        if (s.status === 'completed') continue; // Completed schedules don't block rooms/people usually, but depends on policy. Let's assume they clear out.

        if (s.date === newSchedule.date) {
            const existStart = this.timeToMinutes(s.time);
            const existEnd = this.timeToMinutes(s.endTime);
            const isTimeOverlap = (newStart < existEnd) && (newEnd > existStart);

            if (isTimeOverlap) {
                if (s.room === newSchedule.room) {
                    return `KONFLIK RUANGAN: Ruang "${s.room}" digunakan oleh ${s.studentName} (${s.type}) pukul ${s.time}-${s.endTime}.`;
                }

                const existingPeople = [s.pembimbing1, s.pembimbing2, s.penguji1, s.penguji2]
                    .map(p => p.trim())
                    .filter(p => p && p !== '-');
                
                const conflictingPerson = existingPeople.find(p => newPeople.includes(p));
                if (conflictingPerson) {
                    return `KONFLIK DOSEN: Dosen "${conflictingPerson}" bertugas di sidang ${s.studentName} (${s.type}) pukul ${s.time}-${s.endTime}.`;
                }
            }
        }
    }
    return null;
  }

  async getStats() {
      const all = await this.getSubmissions(); 
      const schedules = await this.getSchedules();

      return {
          total: all.length,
          proposal_passed: all.filter(s => s.status === 'proposal_completed').length,
          skripsi_passed: all.filter(s => s.status === 'skripsi_completed').length,
          pending_revision: all.filter(s => s.status === 'revision_proposal_pending' || s.status === 'revision_skripsi_pending').length,
          upcoming_exams: schedules.filter(s => s.status === 'upcoming').length
      };
  }

  async getOverdueRevisions() {
      const today = new Date();
      const allSubs = await this.getSubmissions();
      const pending = allSubs.filter(s => s.status === 'revision_proposal_pending' || s.status === 'revision_skripsi_pending');
      const schedules = await this.getSchedules();

      return pending.filter(sub => {
          const schedule = schedules.find(sch => sch.submissionId === sub.id && sch.status === 'completed');
          if (schedule) {
              const examDate = new Date(schedule.date);
              const diffTime = Math.abs(today.getTime() - examDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              return diffDays > 7;
          }
          return false;
      });
  }
}

export const db = new MockDatabase();
