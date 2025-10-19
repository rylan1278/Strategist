Developer Notebook - Mini Golf Maze Course

This document tracks the development of the Mini Golf Maze Course made in A-Frame.  
It lists the changes we made step-by-step, key areas of code to adjust, and notes for future improvements.


 1. Quick Start
- Open the project’s index.html in your browser.  
- Use WASD to move the camera, Q/E to aim, and Space to putt.  
- The HUD (on-screen display) shows your strokes, controls, and win messages.  

 2. High-Level Structure
- A-Frame Scene - base 3D environment.  
- Procedural Course Builder - builds fairway + left/right walls via createSegment(start, end, extensions).  
- Physics Engine - handles ball motion, friction, bounce, and collision reflection.  
- Camera Rig - always stays behind the ball; WASD moves the view.  
- HUD Overlay - displays strokes, controls, par, and win notice.  

 3. Development Timeline

  Itteration 0 Base Scene
Created minimal A-Frame scene: a sky, ground, and test sphere.

  Itteration 1 Camera & Ball
Added #cameraRig and made it follow the ball.  
Used a static offset at first to look at the ball.

  Itteration 2 Aiming & Putt
Added `Q` and `E` for rotation (aim angle).  
Space applies forward velocity to the ball and adds to the stroke counter.

  Itteration 3 Camera Movement
Enabled WASD to move the camera rig smoothly around the ball, locked to ground level.

  Itteration 4 Collisions & Bounce
Added wallColliders and reflection math so the ball bounces off walls.  
Tuned friction and bounce multipliers for better feel.

 Itteration 5 Course Generator
Created createSegment(start, end, extensions) to build connected green fairway sections with walls.  
Added per-segment extension values for more control.

 Itteration 6 Start & End Walls
Added horizontal “start” and “end” barriers that line up with the fairway ends.  
Used wood-brown coloring for visual consistency.

  Itteration 7 Win Condition
Added a hole detector when the ball overlaps the hole, it triggers a win event.

  Itteration 8 HUD Overlay
Added an HTML overlay for strokes, controls, and par (9).  
Displays “You Won!” centered for 2 seconds, then resets the ball to start.

