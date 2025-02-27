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

1. A database to store a "sessions" table with the minimum requirements, which
   are:
   - A session ID to access a timer session
   - A start∑
