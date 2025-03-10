import { createClient } from '@supabase/supabase-js';

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.https://ouslqozvofsxyhplfged.supabase.co;
const supabaseKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91c2xxb3p2b2ZzeHlocGxmZ2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MDIyMzksImV4cCI6MjA1NzE3ODIzOX0.v9uKw8zE5Xfa97w4EjPnvjpAMR_j2B54o6TpL_E87xQ;

// Supabase istemcisini oluştur
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };