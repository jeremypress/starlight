## 03/01
Picking development back up with claude code today. Trying to take things slowly and enjoy the process. 
- I got the code syncing over to the phone with tailscale
- I have basic gyro controls on a box that flies around the screen
now i'm trying to figure out the scrolling so that you're challenged to keep moving but you also don't ever hit the top of the screen (unless you go too slow). kind of hitting the same issues again where i can't express what i want, so i'm trying the approach where the ship stays in the middle of the screen and the world moves around you

## 03/15
trying things out in conductor. going to keep working on ship movement since I think there are a few obvious things we can fix before we take a step back and plan things out
- going to add distance markers so i can get a better sense of speed
- steering left and right is wrong, its not a vector in the way that speed is, if you're turning left and then start turning right you should immediately be moving right instead of decreasing your leftness
- ok things now feel tighter, i added some more useful diagnostic info as well as a pause flow
- I think the next most important thing in the loop being fun is adding asteroids to dodge and enemies to fight. if that is all feeling good then spending time on things like art and then cutscenes means we can round out the whole PoC
- lets start with asteroids as rectangles, then enemeies, then shooting them down
- ok initial asteroids are in. they feel good but a couple of issues. its too easy to just slow down and sort of cheat to get out of a sticky situation, and it feels a bit too easy even at full speed. so for one we should make the min speed higher and 2 we should increase asteroid rate and speed as you go to make dodging more of a challenge
- also discussed incentives with soren, why do you want to keep going. the story will play in here but we need more feedback loops around distance or collecting things that make playing feel good

## 03/23
ok we're back again. I think the flying control is decent enough to progress, so its time to replace our boxes with some real graphics. lets start with the ship. I have aseprite on my mac so lets just try using that and see what we can come up with 

## 03/24
Didn't do too much yesterday but that's ok. i drew a very basic ship sprite and it looks like a ship. I also made the hitbox tight to the sprite for more accuracy.

I can sort of see the rest of the high level in order to get to an e2e version of the game
1. asteroid design
2. shooting
3. enemies
4. cutscenes
5. rig up story mode
6. endless mode/ scores
7. music and polish
    - better art, transitions, shaders, etc