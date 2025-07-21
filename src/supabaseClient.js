import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efpfqlwkpjnvdyckahze.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmcGZxbHdrcGpudmR5Y2thaHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTg1OTQsImV4cCI6MjA2ODY3NDU5NH0.-YUyK6dsy9GkkxxQAy7xs4BpI3u-2MBKY102oDCKwDk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);