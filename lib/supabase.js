import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://arfyzosqpaqvyxcczyfg.supabase.co'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZnl6b3NxcGFxdnl4Y2N6eWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDczMzcsImV4cCI6MjA5NTM4MzMzN30.J72bInUSOp2ZKZOJGcuywB441XWV3CTyqOn3RdiFyNg'

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase environment variables are missing! Using fallback credentials.'
  )
}

const storage = Platform.OS === 'web'
  ? undefined  // Uses localStorage automatically on web
  : AsyncStorage

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})