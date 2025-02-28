// Todo: Implement break functionality (Maybe after MVP)

import supabase from './supabase';
import { Database } from '@shared/types/database.types';

export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export const sessionsService = {
  /**
   * Retrieves active sessions for a specific user.
   * Only one active session per user is allowed.
   * 
   * @param userId - The ID of the user to get active sessions for
   * @returns Promise<Session[]> - Array containing the active session (if any)
   * @throws Error if multiple active sessions are found or if database query fails
   * 
   * @example
   * try {
   *   const activeSessions = await sessionsService.getActiveUserSessions(1);
   *   if (activeSessions.length > 0) {
   *     console.log('Active session found:', activeSessions[0]);
   *   }
   * } catch (error) {
   *   console.error('Error fetching active sessions:', error);
   * }
   */
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

  /**
   * Creates a new session in the database.
   * Includes protection against duplicate session creation.
   * 
   * @param sessionData - Object containing the session data to be created
   * @returns Promise<Session[]> - Array containing the newly created session
   * @throws Error if database insert fails, or if user already has an active session
   * 
   * @example
   * try {
   *   const newSessionData = {
   *     user_id: 1,
   *     session_start: new Date().toISOString(),
   *     session_state: 'focus',
   *     planned_duration_minutes: 60,
   *     available_break_time_minutes: 5
   *   };
   *   const createdSession = await sessionsService.createSession(newSessionData);
   *   console.log('New session created:', createdSession[0]);
   * } catch (error) {
   *   console.error('Failed to create session:', error);
   * }
   */
  createSession: async (sessionData: SessionInsert) => {
    try {
      // Add server-side double-check
      if (sessionData.user_id) {
        const existingSessions = await sessionsService.getActiveUserSessions(sessionData.user_id);
        if (existingSessions && existingSessions.length > 0) {
          console.log(`User ${sessionData.user_id} already has an active session - returning existing`);
          return existingSessions; // Return existing sessions instead of creating new one
        }
      }
      
      // Default to focus state if not specified
      if (!sessionData.session_state) {
        sessionData.session_state = 'focus';
      }
      
      // Insert new session
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  /**
   * Updates an existing session with new data.
   * 
   * @param sessionId - ID of the session to update
   * @param sessionData - Object containing the fields to update
   * @returns Promise<void>
   * @throws Error if database update fails
   * 
   * @example
   * try {
   *   // Update session state to break mode
   *   await sessionsService.updateSession(123, {
   *     session_state: 'break',
   *     current_break_session_start: new Date().toISOString(),
   *     current_break_session_planned_duration: 5
   *   });
   *   console.log('Session updated successfully');
   * } catch (error) {
   *   console.error('Failed to update session:', error);
   * }
   */
  updateSession: async (sessionId: number, sessionData: SessionUpdate) => {
    try {
      // Perform the update
      const { data, error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', sessionId)
        .select()
      return data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  /**
   * Deletes a session from the database.
   * Should only be used when discarding an unwanted session.
   * 
   * @param sessionId - ID of the session to delete
   * @returns Promise<void>
   * @throws Error if database delete operation fails
   * 
   * @example
   * try {
   *   await sessionsService.deleteSession(123);
   *   console.log('Session deleted successfully');
   * } catch (error) {
   *   console.error('Failed to delete session:', error);
   * }
   */
  deleteSession: async (sessionId: number) => {
    try {
      // Perform the delete operation
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },
  
  /**
   * Completes an active session by setting its state to 'complete'.
   * This method is used to properly end a session rather than deleting it.
   * 
   * @param sessionId - ID of the session to complete
   * @returns Promise<void>
   * @throws Error if database update fails
   * 
   * @example
   * try {
   *   await sessionsService.completeSession(123);
   *   console.log('Session completed successfully');
   * } catch (error) {
   *   console.error('Failed to complete session:', error);
   * }
   */
  completeSession: async (sessionId: number) => {
    try {
      // Set session state to complete and add end time
      const   { error } = await supabase
        .from('sessions')
        .update({
          session_state: 'complete',
        })
        .eq('id', sessionId);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  },
  
  /**
   * Retrieves active sessions regardless of user.
   * Used for testing and debugging purposes.
   * 
   * @returns Promise<Session[]> - Array of active sessions
   * @throws Error if database query fails
   */
  getActiveSessions: async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .in('session_state', ['focus', 'break'])
        .order('session_start', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }
}; 