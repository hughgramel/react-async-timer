# React async pomodoro timer

The goal of this project is to create a Timer component in react that is able to
update the time based on the start time and the current time. It will calculate
the difference between the start time and the current time, and update the timer
accordingly. Additionally, it should use databases to be able to tell what mode it's in as
it's a pomodoro timer. In general it's meant to be an online pomodoro timer that
generates break time every 25 minutes.

## Specifications

1. When opening the timer, it initially start at whatever the time was set for
   the "focus time" parameter in the format of hh:mm:ss. E.g. if you set it for
   50 minutes it should start at 00:50:00.
2. There should be a break button
3. There should be a end session button that returns an object with the details
   of the session
4. The user should have a certain amount of break time, starting with 5 minutes.
   When they press the "Take a break" button, it should go down 5 minutes.
5. When pressing the break button, it should switch to a 5 minute break timer,
   starting with 00:05:00. Then, it should count down. There should be an option
   "extend break" that does that adds 5 minutes to the break timer, but it
   should only be available if the user has >= 5 minutes break time free.
6. At the end of the break, it should go straight back to the focus time,
   resuming at exactly the time that was left.
7. At the end of the time, the same function as "end session" should be called
   that returns / prints out the session information.

## When should we do API calls

1. When unmounting / navigating off of the page we should save the state of the
   timer.
2. When coming back to the timer, we should check if there's an active session
   with Supabase. If there is, then we should resume that session and use that
   state for the timer.
3. Honestly those should be the only times we save the state of the timer.

## Requirements

### Functions needed

1. getActiveSession

   - This function should get the session in the database that is currently
     active. If there is more than one, then it should throw an exception.

2. setSessionState(Session session)

   - This function should take a session, and set the state to reflect it.

3. isSessionComplete()
   - This should check the timeElapsed, breakTimeElapsed, and startTime and
     determine if the session should end.
4. tick()
   - This function should move forward one tick in the break time or focus time.
5. breakIsComplete()
   - This function should calculate if a break is complete
   - Basically, if breakIsComplete, we should switch to focus mode.
   - Then, the time left is simply
6. switchToFocusMode()
   - This should switch to focus mode
7. saveSessionState()
   - This should save the session state, and either create a newId or update the
     currentOne
8. createNewSession()
   - This should create a new session and set the session Id to whatever it is
     right now
9. timeRemainingBetweenDates()
   - Given two date objects, this should calculate how many seconds are left
     between them.

## More requirements

3. At any given moment we need:

   - Whether we're in focus, break, complete, complete_and_reviewed.
   - The time remaining
   - The total time elapsed.
   - The focus time elapsed
   - The break time elapsed
   - The available break time
   - The break time remaining

4. Now, how do we set the state?

   - For whether we're in focus, break, or complete, we can have a boolean
   - For the time remaining we can have

5. A database to store a "sessions" table with the minimum requirements, which
   are:

   - Okay, so a session is either: In a break or in focus.
   - A session always has the same start time.
   - A break always has the same start time
   - A session always has a certain length that we want to go to, so we have a
     specified end time / planned duration.
   - There is always some elapsed duration, that we can calculate through
     usedBreakTime + currentTime - startTime

   - At any given moment we need
