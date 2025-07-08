import { createClient } from '@supabase/supabase-js'

// Supabase dashboard’da Settings > API bölümünden alacaksın:
const supabaseUrl = 'https://mxnvaskalzmsmbzogspt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bnZhc2thbHptc21iem9nc3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDkxNjgsImV4cCI6MjA2NzIyNTE2OH0.M-F1HYNF7F2rnVPayDwpxMwQ7OWL8z-JP33nH1QL7DA'

export const supabase = createClient(supabaseUrl, supabaseKey)