
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

/**
 * THAY THẾ GIÁ TRỊ TẠI ĐÂY:
 * 1. Vào Supabase Dashboard > Settings > API
 * 2. Copy 'Project URL' dán vào supabaseUrl
 * 3. Copy 'anon public key' dán vào supabaseAnonKey
 */
const supabaseUrl = 'https://smwvtdjaioilfyraokqh.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtd3Z0ZGphaW9pbGZ5cmFva3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDc0NDUsImV4cCI6MjA4MjYyMzQ0NX0.Ygn4EIXPMkGKit6wbw2H4A0FHgL-WbAC_BNh06zRqms';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
