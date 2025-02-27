import { useEffect } from 'react';
import '../styles/Timer.css'



function Timer() {
    const FOCUS_TIME_SECONDS = 3600
    const BREAK_TIME_SECONDS = 300

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

    useEffect(() => {
        console.log(convertSecondsToTimeFormat(60))
        console.log(convertSecondsToTimeFormat(65))
        console.log(convertSecondsToTimeFormat(3600))
        console.log(convertSecondsToTimeFormat(5000))
        console.log(convertSecondsToTimeFormat(86398))
        console.log(convertSecondsToTimeFormat(29))
    });

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
                </div>
              )}
            </div>
            
            <div className="timer-actions">
              <button className="save-button" >Save session</button>
              <button className="discard-button">Discard session</button>
            </div>
          </div>
        </div>
      );    
}

export default Timer;