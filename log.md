## 03/01
Picking development back up with claude code today. Trying to take things slowly and enjoy the process. 
- I got the code syncing over to the phone with tailscale
- I have basic gyro controls on a box that flies around the screen
now i'm trying to figure out the scrolling so that you're challenged to keep moving but you also don't ever hit the top of the screen (unless you go too slow). kind of hitting the same issues again where i can't express what i want, so i'm trying the approach where the ship stays in the middle of the screen and the world moves around you

## 03/15
trying things out in conductor. going to keep working on ship movement since I think there are a few obvious things we can fix before we take a step back and plan things out
- going to add distance markers so i can get a better sense of speed
- steering left and right is wrong, its not a vector in the way that speed is, if you're turning left and then start turning right you should immediately be moving right instead of decreasing your leftness