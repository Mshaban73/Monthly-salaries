import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efpfqlwkpjnvdyckahze.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmcGZxbHdrcGpudmR5Y2thaHplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5ODU5NCwiZXhwIjoyMDY4Njc0NTk0fQ.htnIuyfv0dY-SDjzfwdUy5OqsdersB7kbGR9Dl7QKzE';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);