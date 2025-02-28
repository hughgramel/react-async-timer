// Todo: Implement break functionality (Maybe after MVP)

import supabase from './supabase';
import { Database } from '@shared/types/database.types';

export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export const sessionsService = {

}; 