import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "YOUR_PROJECT_URL"
const supabaseKey = "YOUR_ANON_KEY"

export const supabase = createClient("https://sjajiqfwreaxyfgltvgk.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYWppcWZ3cmVheHlmZ2x0dmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzgzMTgsImV4cCI6MjA4OTg1NDMxOH0.MhF7xcUQ6t3ezeoDe8L4UAtrmjfnk-nSKe5izxtNGAs")