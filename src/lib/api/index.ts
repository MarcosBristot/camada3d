import { isSupabaseConfigured } from '../supabase'
import { demoApi } from './demoApi'
import { supabaseApi } from './supabaseApi'
import type { DataApi } from './types'

export const isDemo = !isSupabaseConfigured
export const api: DataApi = isDemo ? demoApi : supabaseApi

export type * from './types'
