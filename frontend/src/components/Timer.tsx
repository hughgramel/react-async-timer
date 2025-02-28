import { useEffect, useState } from 'react';
import '../styles/Timer.css'
import { sessionsService, Session } from '../services/sessionsService';



function Timer() {
    const FOCUS_TIME_SECONDS = 3600
    const BREAK_TIME_SECONDS = 300

    // Add state to store the fetched sessions
    const [activeSessions, setActiveSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

      /**
       * Calculates and prints time differences between timestamps
       * 
       * @param startTimeStr The start time as ISO string without milliseconds
       * @param currentTimeStr The current time as ISO string without milliseconds
       * @param endTimeStr The end time as ISO string without milliseconds
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
        const sessions = await sessionsService.getActiveUserSessions(1);
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

    useEffect(() => {
        console.log(convertSecondsToTimeFormat(60))
        console.log(convertSecondsToTimeFormat(65))
        console.log(convertSecondsToTimeFormat(3600))
        console.log(convertSecondsToTimeFormat(5000))
        console.log(convertSecondsToTimeFormat(86398))
        console.log(convertSecondsToTimeFormat(29))
        
        // Call the async function and handle the Promise properly
        fetchUserSessions()
          .then(sessions => {
            console.log("Fetched sessions:", sessions);
          })
          .catch(err => {
            console.error("Error in useEffect:", err);
          });
    }, []);

    return (
        <div className="timer-page">
          <div className="timer-container">
            <div>
                <h1 className="timer-header">L1: Focus Session (3h)</h1>
            </div>
            
            <div className="timer-display">
                <div className="large-timer">00:00:00</div>
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
                  <button className='take-break-btn'>
                    Take a break (5 mins left)
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
              <button className="discard-button">Discard session</button>
            </div>
          </div>
        </div>
      );    
}

export default Timer;