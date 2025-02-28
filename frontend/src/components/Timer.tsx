import { useEffect, useState, useRef } from 'react';
import '../styles/Timer.css'
import { sessionsService, Session } from '../services/sessionsService';
import { SessionUpdate } from '../services/sessionsService';


function Timer() {
    const FOCUS_TIME_SECONDS = 3600
    const BREAK_TIME_SECONDS = 300
    const USER_ID = 1;

    // Add state to store the fetched sessions
    const [activeSessions, setActiveSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const secondsRemaining = useRef(0)


  
    // Add a session creation in progress ref to prevent concurrent calls
    const sessionCreationInProgressRef = useRef(false);
    const isInitializedRef = useRef(false);
    const sessionId = useRef(-1)
    const isBreak = useRef(false)
    const breakTimeRemaining = useRef(5)
    const currFocusEndTime = useRef("")
    const currBreakEndTime = useRef<string | null>(null)
    const convertSecondsToMinutes = (seconds: number): number => {
      return Math.floor(seconds / 60)
    }

      /**
       * Calculates and prints time differences between timestamps
       * 
       * @param startTimeStr The start time as UTC string without milliseconds
       * @param currentTimeStr The current time as UTC string without milliseconds
       * @param endTimeStr The end time as UTC string without milliseconds
       */
      const printTimeDifferences = (
        startTimeStr: string | undefined,
        currentTimeStr: string,
        endTimeStr: string | undefined
      ) => {
        if (!startTimeStr || !endTimeStr) {
          console.log('Cannot calculate time differences: missing timestamps');
          return;
        }

        const startDate = new Date(startTimeStr);
        const currentDate = new Date(currentTimeStr);
        const endDate = new Date(endTimeStr);

        // Calculate seconds between current and start
        const elapsedSeconds = Math.floor((currentDate.getTime() - startDate.getTime()) / 1000);

        // Calculate seconds between end and current
        const remainingSeconds = Math.floor((endDate.getTime() - currentDate.getTime()) / 1000);

        console.log('Timestamp Differences:');
        console.log('---------------------');
        console.log('Seconds elapsed (current - start):', elapsedSeconds);
        console.log('Seconds remaining (end - current):', remainingSeconds);
        console.log('---------------------');
      };

    /**
     * Adjusts a Date object by adding or subtracting minutes
     * 
     * @param date The Date object to adjust
     * @param minutesToAdd Number of minutes to add (positive) or subtract (negative)
     * @returns A new Date object with adjusted time
     * 
     * 
     */
    const adjustDateTime = (date: Date | null | undefined, minutesToAdd: number): Date | null | undefined => {
      if (!date) return date;
      
      // Create a new Date object to avoid modifying the original
      const adjustedDate = new Date(date.getTime());
      
      // Add minutes (converting to milliseconds)
      const millisToAdd = minutesToAdd * 60 * 1000;
      adjustedDate.setTime(adjustedDate.getTime() + millisToAdd);
      return adjustedDate;
    };

    /**
     * This function prints out in hh:mm:ss format the number of seconds passed
     * to it. 
     * @param seconds Number of seconds passed
     * @returns A string representing the number of seconds in hh:mm:ss format
     */
    const convertSecondsToTimeFormat = (seconds: number): string => {
        const numHours = Math.floor((seconds / 60) / 60);
        const numMinutes = Math.floor((seconds / 60) % 60)
        const numSeconds = Math.floor(seconds % 60)

        const hoursStr = numHours < 10 ? `0${numHours}` : numHours
        const minutesStr = numMinutes < 10 ? `0${numMinutes}` : numMinutes
        const secondsStr = numSeconds < 10 ? `0${numSeconds}` : numSeconds

        return `${hoursStr}:${minutesStr}:${secondsStr}`
    }

    // Fix this function to properly handle the Promise
    const fetchUserSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Await the Promise to get the actual data
        const sessions = await sessionsService.getActiveUserSessions(USER_ID);
        setActiveSessions(sessions);
        return sessions; // Return actual data, not a Promise
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Failed to fetch sessions");
        return [];
      } finally {
        setIsLoading(false);
      }
    }


    // Modified function to prevent duplicate session creation
    const createNewUserSession = async () => {
      // Prevent concurrent creation attempts
      if (sessionCreationInProgressRef.current) {
        console.log("Session creation already in progress, skipping");
        return null;
      }
      
      try {
        sessionCreationInProgressRef.current = true;
        setIsLoading(true);
        setError(null);
        
        // Double-check one more time that we don't have an active session
        // This helps in case another request created one while we were deciding
        const latestSessions = await sessionsService.getActiveUserSessions(USER_ID);
        if (latestSessions && latestSessions.length > 0) {
          console.log("Session was created by another request, using existing:", latestSessions[0]);
          setActiveSessions(latestSessions);
          return latestSessions;
        }
        
        // No active session, create one
        console.log("Creating new session - confirmed no existing sessions");
        const currTime = new Date();
        const ending_time = adjustDateTime(currTime, convertSecondsToMinutes(FOCUS_TIME_SECONDS))?.toUTCString()

        if (!ending_time) throw new Error

        const session = await sessionsService.createSession({
          break_end_time: null,
          break_minutes_remaining: 5,
          break_start_time: null,
          focus_start_time: currTime.toUTCString(),
          focus_end_time: ending_time,
          session_state: "focus",
          user_id: USER_ID
        });
        setActiveSessions(session);

        currFocusEndTime.current = ending_time
        console.log("curr end time: " + currFocusEndTime.current)
        return session;
      } catch (err) {
        console.error("Error creating session:", err);
        setError("Failed to create session");
        return null;
      } finally {
        sessionCreationInProgressRef.current = false;
        setIsLoading(false);
      }
    };


    const setUIForSession = (session: Session) => {
      if (isBreak.current) {
        console.log("Setting UI to be in break time")
        // Then we want to set the timer to show the break time
        if (session.break_end_time) {
          const endTime = new Date(session.break_end_time);
          const now = new Date()
          const timeDiffInMilliseconds = endTime.getTime() - now.getTime();
          secondsRemaining.current = Math.floor(timeDiffInMilliseconds / 1000);
        }
      } else {
        console.log("Setting UI to be in focus time")
        if (session.focus_end_time) {
          const endTime = new Date(session.focus_end_time);
          const now = new Date()
          const timeDiffInMilliseconds = endTime.getTime() - now.getTime();
          secondsRemaining.current = Math.floor(timeDiffInMilliseconds / 1000);
        }
      }
      console.log(secondsRemaining)
    }

    

    useEffect(() => {
      // Block initialization if already done
      if (isInitializedRef.current) {
        console.log("Session already initialized - skipping");
        return;
      }
      
      console.log("Starting session initialization");
      isInitializedRef.current = true; // Mark initialized immediately

      // Define an async function inside the effect
      const initializeSession = async () => {
        try {
          setIsLoading(true);
          
          // First fetch existing sessions
          const existingSessions = await fetchUserSessions();
          
          // Only create a new session if no active sessions exist
          if (!existingSessions || existingSessions.length === 0) {
            const newSession = await createNewUserSession();
            if (newSession) {
              setUIForSession(newSession[0])
              console.log(newSession[0])
              sessionId.current = newSession[0].id
              console.log(sessionId.current)
            }

          } else {
            console.log("Using existing session:", existingSessions[0]);
            // Initialize timer state with existing session
            console.log("Setting UI for existing session:");
            // Here we can set state.
            sessionId.current = existingSessions[0].id
            isBreak.current = existingSessions[0].session_state == "break"
            if (existingSessions[0].focus_end_time) {
              currFocusEndTime.current = existingSessions[0].focus_end_time
            } else {
              throw new Error("end time is null")
            }
            breakTimeRemaining.current = existingSessions[0].break_minutes_remaining
            currBreakEndTime.current = existingSessions[0].break_end_time
            currFocusEndTime.current = existingSessions[0].focus_end_time
            console.log(sessionId.current)
            console.log(existingSessions[0].session_state == "break")
            console.log(isBreak.current)
            console.log("breaktimeremaining: " + breakTimeRemaining.current)
            setUIForSession(existingSessions[0])
          }
        } catch (error) {
          console.error("Error initializing session:", error);
          setError("Failed to initialize session");
        } finally {
          setIsLoading(false);
        }
      };

      // Call the function

      initializeSession();
    }, []);



    const deleteSession = async () => {
      try {
        await sessionsService.deleteSession(sessionId.current)
        console.log("session deleted")
      } catch (error) {
        console.error("Error initializing session:", error);
        setError("Failed to initialize session");
      }
    }


    const setBreak = async () => {
      if (breakTimeRemaining.current >= 5) {
        // Now if we're already in a 
        if (!isBreak.current) {
          console.log("Starting new break")
          const currTime = new Date();
          const breakEndingTime = adjustDateTime(currTime, convertSecondsToMinutes(BREAK_TIME_SECONDS))?.toUTCString()
          const session: SessionUpdate = {
            break_end_time: breakEndingTime,
            // focus_end_time: adjustDateTime(new Date(currFocusEndTime.current), convertSecondsToMinutes(BREAK_TIME_SECONDS))?.toUTCString(),
            break_start_time: currTime.toUTCString(),
            break_minutes_remaining: breakTimeRemaining.current - 5,
            session_state: "break",
          };
          if (!breakEndingTime) {
            throw new Error("Break ending time is null")
          }
          console.log("breakending time " + breakEndingTime)
          currBreakEndTime.current = breakEndingTime;
          const updatedWithBreak = await sessionsService.updateSession(sessionId.current, session)
          if (updatedWithBreak) {
            setActiveSessions(updatedWithBreak);
          }
          isBreak.current = true;
        } else {
          // This means there's already a current break
          console.log("Adding break time to already going break")
          console.log(currBreakEndTime.current)
          if (!currBreakEndTime.current) {
            throw new Error("Curr break ending time is null")
          }
          const breakEndingTime = adjustDateTime(new Date(currBreakEndTime.current), convertSecondsToMinutes(BREAK_TIME_SECONDS))?.toUTCString()
          console.log(breakEndingTime)
          const session: SessionUpdate = {
            break_end_time: breakEndingTime,
            // focus_end_time: adjustDateTime(new Date(currFocusEndTime.current), convertSecondsToMinutes(BREAK_TIME_SECONDS))?.toUTCString(),
            break_minutes_remaining: breakTimeRemaining.current - 5,
            session_state: "break",
          };
          if (!breakEndingTime) {
            throw new Error("Break ending time is null")
          }
          currBreakEndTime.current = breakEndingTime;
          console.log()
          const updatedWithBreak = await sessionsService.updateSession(sessionId.current, session)
          if (updatedWithBreak) {
            setActiveSessions(updatedWithBreak);
          }
        }
      } else {
        console.log("Not enough break time!")
      }
    }

    const returnToFocus = async () => {
      console.log("Turning session back to focus");
      const session: SessionUpdate = {
        session_state: "focus",
      };
      const updatedWithBreak = await sessionsService.updateSession(sessionId.current, session)
      if (updatedWithBreak) {
        setActiveSessions(updatedWithBreak);
        isBreak.current = false;
      }
      console.log(updatedWithBreak)
    }

    return (
        <div className="timer-page">
          <div className="timer-container">
            <div>
                <h1 className="timer-header">L1: {isBreak.current ? "Break" : "Focus"} Session (3h)</h1>
            </div>
            
            <div className="timer-display">
                <div className="large-timer">{convertSecondsToTimeFormat(secondsRemaining.current)}</div>
            </div>
            
            <div className="timer-progress">
              
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: "10%" }}
                  ></div>
                </div>
              {(
                <div className="break-text">
                  <button className='take-break-btn' onClick={setBreak}>
                    Take a break (5 mins left)
                  </button>
                  <button className='take-break-btn' onClick={returnToFocus}>
                    Go back to focus
                  </button>
                  <button onClick={async () => {
                    // Properly handle the Promise when button is clicked
                    const sessions = await fetchUserSessions();
                    console.log("Active sessions:", sessions);
                  }}>
                    Get active sessions
                  </button>
                </div>
              )}
            </div>
            {/* Render the fetched sessions for testing */}
            {isLoading ? (
              <div>Loading sessions...</div>
            ) : error ? (
              <div>Error: {error}</div>
            ) : (
              <div>
                <h3>Active Sessions ({activeSessions.length})</h3>
                {activeSessions.map(session => (
                  <div key={session.id}>
                    Session ID: {session.id}, 
                    State: {session.session_state}
                  </div>
                ))}
              </div>
            )}
            
            <div className="timer-actions">
              <button className="save-button" >Save session</button>
              <button className="discard-button" onClick={deleteSession}>Discard session</button>
            </div>
          </div>
        </div>
      );    
}

export default Timer;