import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://sjajiqfwreaxyfgltvgk.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYWppcWZ3cmVheHlmZ2x0dmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzgzMTgsImV4cCI6MjA4OTg1NDMxOH0.MhF7xcUQ6t3ezeoDe8L4UAtrmjfnk-nSKe5izxtNGAs"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)