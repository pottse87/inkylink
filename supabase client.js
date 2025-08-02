// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drnfvuorvdipxxmtdsbt.supabase.co'; // your project URL
const supabaseKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybmZ2dW9ydmRpcHh4bXRkc2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4OTA4NSwiZXhwIjoyMDY5NjY1MDg1fQ.XM_Q5qb9F_vw588U2L1B6EuAKTKPKhYf65aGQkwfL4Y // 🔐 Service Role Key only for secure environments

export const supabase = createClient(supabaseUrl, supabaseKey);
