import { createClient } from '@supabase/supabase-js'

// Pegue esses dados no Painel do Supabase: Project Settings > API
const supabaseUrl = 'https://drorhwwmogftgasnvpow.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyb3Jod3dtb2dmdGdhc252cG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjIxODUsImV4cCI6MjA3MTQzODE4NX0.i0o7L6jWJxko-drmYHkYPL-Xh2ph42Atbt-g-Vau7Rs'

export const supabase = createClient(supabaseUrl, supabaseKey)