// --- START OF FILE src/supabaseClient.ts (النسخة النهائية والمحسنة) ---

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// إضافة فحص للتأكد من أن متغيرات البيئة معرفة
// هذا يمنع أخطاء غامضة إذا نسيت إضافة المتغيرات في ملف .env
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or Anon Key are missing from environment variables. Make sure they are defined in your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);