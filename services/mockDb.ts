
import { Submission, Schedule, FileRequirement } from '../types';
import { PROPOSAL_REQUIREMENTS, SKRIPSI_REQUIREMENTS, PROPOSAL_REVISION_REQUIREMENTS, SKRIPSI_REVISION_REQUIREMENTS } from '../constants';
import { supabase } from './supabase';

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

  constructor() {
      this.loadFromStorage();
  }

  // --- Persistence Logic ---
  private loadFromStorage() {
      if (typeof window !== 'undefined') {
          const storedSubs = localStorage.getItem(this.STORAGE_KEY_SUBMISSIONS);
          const storedScheds = localStorage.getItem(this.STORAGE_KEY_SCHEDULES);
          if (storedSubs) this.submissions = JSON.parse(storedSubs);
          if (storedScheds) this.schedules = JSON.parse(storedScheds);
      }
  }

  private saveToStorage() {
      if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY_SUBMISSIONS, JSON.stringify(this.submissions));
          localStorage.setItem(this.STORAGE_KEY_SCHEDULES, JSON.stringify(this.schedules));
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
  getRequirements(type: 'proposal' | 'skripsi') {
      return type === 'proposal' ? this.proposalRequirements : this.skripsiRequirements;
  }

  updateRequirements(type: 'proposal' | 'skripsi', newReqs: FileRequirement[]) {
      if (type === 'proposal') this.proposalRequirements = newReqs;
      else this.skripsiRequirements = newReqs;
  }

  getRevisionRequirements(type: 'proposal' | 'skripsi') {
      return type === 'proposal' ? this.proposalRevisionRequirements : this.skripsiRevisionRequirements;
  }

  updateRevisionRequirements(type: 'proposal' | 'skripsi', newReqs: FileRequirement[]) {
      if (type === 'proposal') this.proposalRevisionRequirements = newReqs;
      else this.skripsiRevisionRequirements = newReqs;
  }

  getRooms() {
      return this.rooms;
  }
  
  addRoom(roomName: string) {
      if (!this.rooms.includes(roomName)) this.rooms.push(roomName);
  }

  deleteRoom(roomName: string) {
      this.rooms = this.rooms.filter(r => r !== roomName);
  }

  // --- ASYNC DATA OPERATIONS ---

  // 1. GET SUBMISSIONS
  async getSubmissions(): Promise<Submission[]> {
      // 1. Try Supabase if connected
      if (supabase) {
          const { data, error } = await supabase.from('submissions').select('*');
          if (!error && data) {
              if (data.length > 0) return data as unknown as Submission[]; 
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
      const existingIndex = this.submissions.findIndex(s => s.studentNpm === submission.studentNpm && s.type === submission.type);
      if (existingIndex >= 0) {
        this.submissions[existingIndex] = submission;
      } else {
        this.submissions.push(submission);
      }
      this.saveToStorage();

      // Update Supabase
      if (supabase) {
          const { error } = await supabase.from('submissions').upsert(submission);
          if (error) console.error("Supabase Error:", error);
      }
  }

  async submitRevision(submissionId: string, files: Submission['files']): Promise<void> {
      const sub = this.submissions.find(s => s.id === submissionId);
      if (sub) {
        sub.files = { ...sub.files, ...files };
        sub.validations = {}; 
        this.saveToStorage();

        if (supabase) {
             await supabase.from('submissions').update({ files: sub.files, validations: {} }).eq('id', submissionId);
        }
      }
  }

  // 3. VALIDATION
  async validateFile(submissionId: string, fileId: string, isValid: boolean, notes: string = ''): Promise<void> {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (sub) {
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
          await supabase.from('submissions').update({ validations: sub.validations, status: sub.status }).eq('id', submissionId);
      }
    }
  }

  async resetFileValidation(submissionId: string, fileId: string): Promise<void> {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (sub) {
      delete sub.validations[fileId];
      if (!sub.status.includes('revision') && !sub.status.includes('completed')) {
          sub.status = 'pending'; 
      }
      this.saveToStorage();

      if (supabase) {
          await supabase.from('submissions').update({ validations: sub.validations, status: sub.status }).eq('id', submissionId);
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
      if (supabase) {
          const { data, error } = await supabase.from('schedules').select('*');
          if (!error && data && data.length > 0) return data as Schedule[];
      }
      return new Promise(resolve => setTimeout(() => resolve([...this.schedules]), 300));
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
          await supabase.from('schedules').insert(schedule);
          await supabase.from('submissions').update({ status: 'scheduled' }).eq('id', schedule.submissionId);
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
