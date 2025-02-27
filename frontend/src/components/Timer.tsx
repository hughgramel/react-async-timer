import '../styles/Timer.css'

function Timer() {
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