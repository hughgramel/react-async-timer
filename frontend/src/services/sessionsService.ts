// Todo: Implement break functionality (Maybe after MVP)

import supabase from './supabase';
import { Database } from '@shared/types/database.types';

export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export const sessionsService = {
  // This function will get all active sessions for a user. If there is more
  // than one, it will throw an exception.
  getActiveUserSessions: async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .in('session_state', ['focus', 'break'])
        .select()
      if (data && data.length > 1) {
        throw new Error("There should only be one active session for the user " + userId)
      }
      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  },

  // Other functions

  // startSession: This function should start a session, the return back the
  // data object so we can get the new id. 


  // updateSession: This should update the session to any state we need. 

  // deleteSession: This should delete the current session and only happen if we
  // click discard
  
}; 