import { useEffect, useState, useRef } from 'react';
import '../styles/Timer.css'
import { sessionsService, Session } from '../services/sessionsService';
import { SessionUpdate } from '../services/sessionsService';
import { copyFileSync } from 'fs';

/*
 * Timer component that manages Pomodoro-style focus and break sessions.
 *
 * This component handles:
 * - Creating and managing user focus sessions
 * - Tracking time elapsed and remaining during sessions
 * - Managing transitions between focus and break states
 * - Persisting session data through API calls
 * - Providing UI controls for session management (breaks, discarding)
 *
 * The component initializes by checking for existing active sessions and
 * creating a new one if none exist. It uses refs for most state management
 * to avoid re-renders and ensure timer accuracy.
 *
 * @returns {JSX.Element} The rendered Timer component
 */
function Timer() {
    const FOCUS_TIME_SECONDS = 60
    const BREAK_TIME_SECONDS = 60
    const USER_ID = 1;

    // Add state to store the fetched sessions
    const [activeSessions, setActiveSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setRerender] = useState(0)
    const secondsRemaining = useRef(0)



    // Add a session creation in progress ref to prevent concurrent calls
    const secondsElapsed = useRef(0)
    const sessionCreationInProgressRef = useRef(false);
    const isInitializedRef = useRef(false);
    const sessionId = useRef(-1)
    const isBreak = useRef(false)
    const breakTimeRemaining = useRef(5)
    const currFocusEndTime = useRef("")
    const currBreakEndTime = useRef("")
    const currFocusStartTime = useRef("")
    const currBreakStartTime = useRef("")
    const intervalRef = useRef<NodeJS.Timeout>();
    const isCompleted = useRef(false)
    const totalMinutesElapsedRoundedToFifteen = useRef(0)


    /**
     * Converts seconds to minutes, rounding down to the nearest minute.
     * 
     * @param {number} seconds - The number of seconds to convert
     * @returns {number} The equivalent number of whole minutes
     */
    const convertSecondsToMinutes = (seconds: number): number => {
      return Math.floor(seconds / 60)
    }



    /**
     * Adjusts a Date object by adding or subtracting minutes.
     *
     * Creates a new Date object with the adjusted time to avoid modifying the original.
     *
     * @param {Date | null | undefined} date - The Date object to adjust
     * @param {number} minutesToAdd - Number of minutes to add (positive) or subtract (negative)
     * @returns {Date | null | undefined} A new Date object with adjusted time, or null/undefined if input was null/undefined
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
     * Adjusts a Date object by adding or subtracting seconds.
     * 
     * Creates a new Date object with the adjusted time to avoid modifying the original.
     * 
     * @param {Date | null | undefined} date - The Date object to adjust
     * @param {number} secondsToAdd - Number of seconds to add (positive) or subtract (negative)
     * @returns {Date | null | undefined} A new Date object with adjusted time, or null/undefined if input was null/undefined
     */
    const adjustDateTimeInSeconds = (date: Date | null | undefined, secondsToAdd: number): Date | null | undefined => {
        if (!date) return date;

        // Create a new Date object to avoid modifying the original
        const adjustedDate = new Date(date.getTime());

        // Add minutes (converting to milliseconds)
        const millisToAdd = secondsToAdd * 1000;
        adjustedDate.setTime(adjustedDate.getTime() + millisToAdd);
        return adjustedDate;
    };

    /**
     * Converts a duration in seconds to a formatted time string (hh:mm:ss).
     * 
     * @param {number} seconds - The number of seconds to format
     * @returns {string} A formatted time string in the format "hh:mm:ss"
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

    /**
     * Fetches active sessions for the current user from the API.
     * 
     * Updates component state with loading status, errors, and retrieved sessions.
     * 
     * @returns {Promise<Session[]>} Promise resolving to an array of active session objects
     */
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


    /**
     * Creates a new focus session for the current user.
     * 
     * Includes safeguards against concurrent creation and checks for existing sessions
     * before creating a new one. Sets up initial focus times and persists the session to the API.
     * 
     * @returns {Promise<Session[] | null>} Promise resolving to the created session array or null if creation failed
     */
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
          user_id: USER_ID,
          planned_minutes: convertSecondsToMinutes(FOCUS_TIME_SECONDS)
        });
        setActiveSessions(session);

        // Done
        currFocusEndTime.current = ending_time
        currFocusStartTime.current = currTime.toUTCString()
        // Done
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


    
    /**
     * Updates the secondsRemaining and secondsElapsed refs based on the current stored end times.
     * 
     * This is used during the timer tick to update the time values without requiring a full
     * session fetch from the API.
     * 
     * @throws {Error} If the required time references are null during the active state
     */
    const setRemainingTimesFromEndTimes = () => {
      if (isBreak.current) {
        // Then we want to set the break remaining time
        if (!currBreakEndTime.current || !currBreakStartTime) throw new Error("Break time must not be null here");
          const endTime = new Date(currBreakEndTime.current);
          const now = new Date()
          const timeDiffInMilliseconds = endTime.getTime() - now.getTime();
          secondsRemaining.current = Math.ceil(timeDiffInMilliseconds / 1000);

          console.log(secondsRemaining.current)

          const startTime = new Date(currBreakStartTime.current)
          const elapsedTimeDiffInMilliseconds = now.getTime() - startTime.getTime()
          secondsElapsed.current = Math.floor(elapsedTimeDiffInMilliseconds / 1000)

          console.log(secondsElapsed.current)
      } else {
        if (!currFocusEndTime.current || !currFocusStartTime) throw new Error("Break time must not be null here");
          const endTime = new Date(currFocusEndTime.current);
          const now = new Date()
          const timeDiffInMilliseconds = endTime.getTime() - now.getTime();
          secondsRemaining.current = Math.ceil(timeDiffInMilliseconds / 1000);
          console.log(secondsRemaining.current)

          const startTime = new Date(currFocusStartTime.current)
          const elapsedTimeDiffInMilliseconds = now.getTime() - startTime.getTime()
          secondsElapsed.current = Math.floor(elapsedTimeDiffInMilliseconds / 1000)
          console.log("seconds elapsed: " + secondsElapsed.current)
      }
    }

    /**
     * Sets the remaining and elapsed time values based on a session object.
     * 
     * Used when initializing or updating the timer from a session fetched from the API.
     * Calculates both secondsRemaining and secondsElapsed based on the current time
     * and the stored start/end times.
     * 
     * @param {Session} session - The session object containing time values
     */
    const setRemainingAndElapsedTime = (session: Session) => {
      if (isBreak.current) {
        // Then we want to set the break remaining time
        if (session && session.break_end_time && session.break_start_time) {
          const endTime = new Date(session.break_end_time);
          const now = new Date()
          const timeDiffInMilliseconds = endTime.getTime() - now.getTime();
          secondsRemaining.current = Math.ceil(timeDiffInMilliseconds / 1000);
          console.log(secondsRemaining.current)

          const startTime = new Date(session.break_start_time)
          const elapsedTimeDiffInMilliseconds = now.getTime() - startTime.getTime()
          secondsElapsed.current = Math.floor(elapsedTimeDiffInMilliseconds / 1000)
          console.log(secondsElapsed.current)
        }
      } else {
        if (session && session.focus_end_time && session.focus_start_time) {
          const endTime = new Date(session.focus_end_time);
          const now = new Date()
          const timeDiffInMilliseconds = endTime.getTime() - now.getTime();
          secondsRemaining.current = Math.ceil(timeDiffInMilliseconds / 1000);
          console.log(secondsRemaining.current)

          const startTime = new Date(session.focus_start_time)
          const elapsedTimeDiffInMilliseconds = now.getTime() - startTime.getTime()
          secondsElapsed.current = Math.floor(elapsedTimeDiffInMilliseconds / 1000)
          console.log(secondsElapsed.current)
        }
      }
    }



    /**
     * Checks if the current timer has expired and handles session end if needed.
     * 
     * Called on every tick of the timer to determine if the session state
     * should transition.
     */
    const checkTime = () => {
      console.log("checking time")
      console.log(secondsRemaining)
      console.log(secondsElapsed)
      // if (isBreak.current && )

      if (secondsRemaining.current <= 0) {
        const overflowSeconds = -1 * secondsRemaining.current;
        // Now this is the positive integer of how many seconds we went over
        secondsElapsed.current = secondsElapsed.current - overflowSeconds
        // Now secondsElapsed correctly reflects it's actual time.
        if (isBreak.current) {
          returnToFocus()
        } else {
          // Then it's over
          handleSessionEnd()
        }
      }
    }

    /**
     * Handles the actions needed when a session (focus or break) ends.
     * 
     * Placeholder for session completion logic.
     */
    const handleSessionEnd = () => {
      isBreak.current = false
      setRemainingTimesFromEndTimes()
      console.log("Time elapsed: " + secondsElapsed.current)

      const totalFocusMinutes = Math.floor(secondsElapsed.current / 60)
      const totalFocusMinutesRoundedToNearestFifteenMinutes = Math.floor(totalFocusMinutes / 15) * 15
      console.log(totalFocusMinutes)
      console.log(totalFocusMinutesRoundedToNearestFifteenMinutes)

      const endSession = async () => {
        await sessionsService.updateSession(sessionId.current, {
          session_state: 'complete',
          total_minutes_done: totalFocusMinutes
        })
      }
      endSession()

      secondsRemaining.current = 0
      secondsElapsed.current = 0
      sessionCreationInProgressRef.current = false;
      totalMinutesElapsedRoundedToFifteen.current = totalFocusMinutesRoundedToNearestFifteenMinutes
      
      isCompleted.current = true;

      clearInterval(intervalRef.current)
      setRerender((e) => e + 1)
    }

    useEffect(() => {
      tick()
      return () => clearInterval(intervalRef.current); // Cleanup when component unmounts
    }, [])

    /**
     * Initiates the timer tick interval that updates the UI every second.
     * 
     * Sets up an interval that updates time calculations and checks for 
     * session completion every second.
     */
    const tick = () => {
      intervalRef.current = setInterval(() => {
        setRemainingTimesFromEndTimes()
        checkTime();
        setRerender((e) => e + 1)
        // Done
        console.log(currFocusEndTime.current)
        console.log(currBreakEndTime.current)
        console.log(currFocusStartTime.current)
        console.log(currBreakStartTime.current)

      }, 1000); // Runs every 1 second
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
              setRemainingAndElapsedTime(newSession[0])
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
            // Done
            if (existingSessions[0].focus_end_time && existingSessions[0].focus_start_time) {
              currFocusEndTime.current = existingSessions[0].focus_end_time
              currFocusStartTime.current = existingSessions[0].focus_start_time
            } else {
              throw new Error("end time is null")
            }
            breakTimeRemaining.current = existingSessions[0].break_minutes_remaining
            if (existingSessions[0].break_end_time && existingSessions[0].break_start_time) {
              currBreakEndTime.current = existingSessions[0].break_end_time
              currBreakStartTime.current = existingSessions[0].break_start_time
            } else {
              currBreakEndTime.current = ""
            }

            console.log(sessionId.current)
            console.log(existingSessions[0].session_state == "break")
            console.log(isBreak.current)
            console.log("breaktimeremaining: " + breakTimeRemaining.current)
            setRemainingTimesFromEndTimes()
            if (secondsRemaining.current <= 0) {
              const overflowSeconds = -1 * secondsRemaining.current;
              // Now this is the positive integer of how many seconds we went over
              secondsElapsed.current = secondsElapsed.current - overflowSeconds
              // Now secondsElapsed correctly reflects it's actual time.
              if (isBreak.current) {
                returnToFocus()
              } else {
                // Then it's over
                handleSessionEnd()
              }
            }
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



    /**
     * Deletes the current session from the database.
     *
     * Calls the API to remove the session and triggers a re-render.
     *
     * @returns {Promise<void>} Promise that resolves when the session is deleted
     */
    const deleteSession = async () => {
      try {
        await sessionsService.deleteSession(sessionId.current)
        console.log("session deleted")
        setRerender((e) => e + 1)
      } catch (error) {
        console.error("Error initializing session:", error);
        setError("Failed to initialize session");
      }
    }


    /**
     * Initiates or extends a break session.
     * 
     * This function:
     * 1. Checks if the user has break time remaining
     * 2. Creates a new break if not currently on break, or extends the current break
     * 3. Updates the relevant time references and session state
     * 4. Persists changes to the database
     * 
     * @returns {Promise<void>} Promise that resolves when the break is set or extended
     * @throws {Error} If break ending time calculations result in null values
     */
    const setBreak = async () => {
      if (breakTimeRemaining.current >= 5) {
        // Now if we're already in a 
        if (!isBreak.current) {
          console.log("Starting new break")
          const currTime = new Date();
          const breakEndingTime = adjustDateTime(currTime, convertSecondsToMinutes(BREAK_TIME_SECONDS))?.toUTCString()
          const session: SessionUpdate = {
            break_end_time: breakEndingTime,
            break_start_time: currTime.toUTCString(),
            break_minutes_remaining: breakTimeRemaining.current - 5,
            session_state: "break",
          };
          if (!breakEndingTime) {
            throw new Error("Break ending time is null")
          }
          console.log("breakending time " + breakEndingTime)
          currBreakEndTime.current = breakEndingTime;
          currBreakStartTime.current = currTime.toUTCString()
          const updatedWithBreak = await sessionsService.updateSession(sessionId.current, session)
          if (updatedWithBreak) {
            setActiveSessions(updatedWithBreak);
          }
          isBreak.current = true;
          if (updatedWithBreak && updatedWithBreak[0]) {
            setRemainingAndElapsedTime(updatedWithBreak[0])
          } else {
            throw new Error("Break is null")
          }
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
          if (updatedWithBreak && updatedWithBreak[0]) {
            setRemainingAndElapsedTime(updatedWithBreak[0])
          }
        }
        breakTimeRemaining.current -= 5
        setRerender((e) => e + 1)
      } else {
        console.log("Not enough break time!")
      }
    }

    /**
     * Transitions from break state back to focus state.
     *
     * This function:
     * 1. Calculates how long the break lasted
     * 2. Updates the focus end time to account for the break
     * 3. Changes the session state back to focus
     * 4. Persists changes to the database
     *
     * @returns {Promise<void>} Promise that resolves when focus mode is restored
     * @throws {Error} If focus time calculations result in null values
     */
    const returnToFocus = async () => {
      // console.log("Turning session back to focus");
      // const breakTimeElapsed = secondsElapsed.current

      // console.log("Current seconds elapsed: " + secondsElapsed.current)
      // console.log("Current seconds remaining: " + secondsRemaining.current)

      // const newEndDateString = adjustDateTimeInSeconds(new Date(currFocusEndTime.current), secondsElapsed.current)?.toUTCString()

      const session: SessionUpdate = {
        session_state: "focus",
      };
      const updatedWithBreak = await sessionsService.updateSession(sessionId.current, session)
      // if (!newEndDateString) throw new Error("New end date is null")
      // currFocusEndTime.current = newEndDateString
      if (updatedWithBreak) {
        setActiveSessions(updatedWithBreak);
        isBreak.current = false;
      }
      // console.log(updatedWithBreak)

      // if (updatedWithBreak && updatedWithBreak[0]) {
      //   // setRemainingAndElapsedTime(updatedWithBreak[0])
      //   // This will reduce the focus time
      // } else {
      //   throw new Error("Focus time is null")
      // }
      // console.log("Updated with break session: " + updatedWithBreak[0])
      // console.log("Current seconds elapsed after: " + secondsElapsed.current)
      // console.log("Current seconds remaining after: " + secondsRemaining.current)
      setRemainingTimesFromEndTimes()
      setRerender((e) => e + 1)

    }

    const getMinutesOrHoursIfOverSixty = (seconds: number): string => {
      if (seconds < 3600) {
        return (seconds / 60) + "m"
      } else {
        return (seconds / 60 / 60) + "h"
      }
    }

    const formatToJustTime = (dateString: string): string => {
      const date = new Date(dateString);
    
      // This will produce something like "2:45 PM"
      const timeString = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    
      // Split at space: ["2:45", "PM"]
      const [time, ampm] = timeString.split(' ');
    
      // Make "PM" => "pm" and remove the space
      return `${time}${ampm.toLowerCase()}`;
    }

    return (
  
        <div className="timer-page">
          {
            isCompleted.current ? 
              <div>
                <h1 className="timer header">Session complete!</h1>
                <h2>Total time elapsed: {totalMinutesElapsedRoundedToFifteen.current}</h2>
                <h2>Start time: {formatToJustTime(currFocusStartTime.current)}</h2>
                <h2>End time: {formatToJustTime(currFocusEndTime.current)}</h2>
              </div> :
            <div className="timer-container">
              <div>
                  <h1 className="timer-header">{isBreak.current ? "" : "L1: " }{isBreak.current ? "Break" : "Focus"} Session ({isBreak.current ? getMinutesOrHoursIfOverSixty(BREAK_TIME_SECONDS) : getMinutesOrHoursIfOverSixty(FOCUS_TIME_SECONDS)})</h1>
              </div>

              <div className="timer-display">
                  <div className="small-timer">{convertSecondsToTimeFormat(secondsRemaining.current < 0 ? secondsElapsed.current - (-1 * secondsRemaining.current) : secondsElapsed.current)}</div>
              </div>

              <div className="timer-display">
                  <div className="large-timer">{convertSecondsToTimeFormat(secondsRemaining.current < 0 ? 0 : secondsRemaining.current)}</div>
              </div>

              <div className="timer-progress">

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(secondsElapsed.current / (secondsElapsed.current + secondsRemaining.current)) * 100}%` }}
                    ></div>
                  </div>
                {(
                  <div className="break-text">
                    {
                      isBreak.current ? <div>
                        <button className='take-break-btn' onClick={returnToFocus} >
                      Go back to focus
                    </button>
                    <button className='take-break-btn' onClick={setBreak} disabled={breakTimeRemaining.current == 0 ? true : false}>
                      Extend your break ({breakTimeRemaining.current} mins left)
                    </button>
                      </div>
                      :  <button className='take-break-btn' onClick={setBreak} disabled={breakTimeRemaining.current == 0 ? true : false}>
                      Take a break ({breakTimeRemaining.current} mins left)
                    </button>
                    }
                  </div>
                )}
              </div>
              {/* Render the fetched sessions for testing */}
              {/* {isLoading ? (
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
              )} */}

              <div className="timer-actions">
                <button className="save-button" onClick={handleSessionEnd}>Save session</button>
                <button className="discard-button" onClick={deleteSession}>Discard session</button>
              </div>
            </div>
          }
        </div>
      );
}

export default Timer;