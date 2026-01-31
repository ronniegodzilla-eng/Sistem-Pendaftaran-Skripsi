import { createClient } from '@supabase/supabase-js';

// In a real application, these should be in your .env file
// Example: REACT_APP_SUPABASE_URL=https://xyz.supabase.co
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// We only initialize if keys are present
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

/**
 * How to set up your Supabase Table:
 * 1. Create a table named 'mahasiswa'
 * 2. Import your CSV directly into this table via the Supabase Dashboard.
 * 3. Ensure columns match: npm (text, primary key), nama, prodi, judul_skripsi, pembimbing_1, pembimbing_2, penguji_1, penguji_2
 */