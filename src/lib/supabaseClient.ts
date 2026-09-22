import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pupleaopydtjqlcplaha.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cGxlYW9weWR0anFsY3BsYWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDE0ODcsImV4cCI6MjEwMzgxNzQ4N30.amZEKNxP1xpo8BLs8t0MdbNIwu9CCdwE252iMTn78mU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);