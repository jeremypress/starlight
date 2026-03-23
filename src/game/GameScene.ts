import Phaser from 'phaser'
import { spawnIntervalMs, randomAsteroidSize, spawnXNearPlayer } from './asteroids.ts'
import { difficultyAt } from './difficulty.ts'
import { triangleRectOverlap } from './collision.ts'

export class GameScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite
  private gyroX = 0
  private gyroY = 0
  private stars: Phaser.GameObjects.Rectangle[] = []
  private scrollSpeed = 100 // px/s, controlled by forward/back tilt
  private tiltIndicator!: Phaser.GameObjects.Rectangle
  private speedBar!: Phaser.GameObjects.Rectangle
  private speedLabel!: Phaser.GameObjects.Text

  // Asteroids
  private asteroids: Phaser.GameObjects.Rectangle[] = []
  private distanceTraveled = 0
  private timeSinceLastSpawn = 0
  private dead = false
  private elapsedTime = 0

  private onGameOver?: (distance: number) => void

  constructor(private betaOffset: number, onGameOver?: (distance: number) => void) {
    super({ key: 'GameScene' })
    this.onGameOver = onGameOver
  }

  setBetaOffset(offset: number) {
    this.betaOffset = offset
  }

  preload() {
    // Load sprite assets — drop .png files into public/sprites/
    // The ship sprite should be named "ship.png" (recommended: 32×32 pixels)
    this.load.image('ship', 'sprites/ship.png')
    // Silence errors for missing sprites so the game still works without them
    this.load.on('loaderror', () => { /* sprite not yet added, use fallback */ })
  }

  create() {
    // Scatter small stars across the canvas for spatial reference
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, 360)
      const y = Phaser.Math.Between(0, 640)
      const size = Phaser.Math.Between(1, 3)
      const alpha = Phaser.Math.FloatBetween(0.4, 1.0)
      this.stars.push(this.add.rectangle(x, y, size, size, 0xffffff).setAlpha(alpha))
    }

    // Create the ship — use sprite if available, red square as fallback
    if (this.textures.exists('ship')) {
      this.ship = this.add.sprite(180, 500, 'ship')
    } else {
      this.ship = this.add.rectangle(180, 500, 40, 40, 0xff0000)
    }
    this.physics.add.existing(this.ship)

    const body = this.ship.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
    body.setMaxVelocity(300)

    // Vertical tilt indicator — track on the right edge, pip moves up/down
    const tiltTrackX = 345
    const tiltTrackH = 100
    const tiltTrackY = 320 // center of screen
    this.add.rectangle(tiltTrackX, tiltTrackY, 4, tiltTrackH, 0x444444)
    this.tiltIndicator = this.add.rectangle(tiltTrackX, tiltTrackY, 8, 8, 0x00ff00)

    // Speedometer — horizontal bar in bottom-left corner
    const speedBarX = 10
    const speedBarY = 620
    const speedBarW = 80
    this.add.text(speedBarX, speedBarY - 14, 'SPD', {
      fontSize: '10px',
      color: '#888888',
      fontFamily: 'monospace',
    })
    this.add.rectangle(
      speedBarX + speedBarW / 2, speedBarY + 4, speedBarW, 6, 0x444444
    )
    this.speedBar = this.add.rectangle(
      speedBarX, speedBarY + 4, 0, 6, 0x00ff00
    ).setOrigin(0, 0.5)
    this.speedLabel = this.add.text(speedBarX + speedBarW + 4, speedBarY - 2, '', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
    })

    // Listen for device orientation
    window.addEventListener('deviceorientation', this.handleOrientation.bind(this))

    // Instructions
    this.add.text(180, 50, 'Tilt to move!', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5)
  }

  private handleOrientation(event: DeviceOrientationEvent) {
    // gamma: left/right tilt (-90 to 90)
    // beta: front/back tilt (-180 to 180)
    if (event.gamma !== null && event.beta !== null) {
      this.gyroX = event.gamma
      this.gyroY = event.beta
    }
  }

  /** Reset game state for a fresh run (called on restart). */
  restart() {
    // Remove all asteroids
    for (const a of this.asteroids) {
      a.destroy()
    }
    this.asteroids = []
    this.distanceTraveled = 0
    this.timeSinceLastSpawn = 0
    this.scrollSpeed = 100
    this.dead = false
    this.elapsedTime = 0

    // Reset ship position
    this.ship.setPosition(180, 500)
    this.ship.setAlpha(1)
    const body = this.ship.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
  }

  update(_time: number, delta: number) {
    if (this.dead) return

    const body = this.ship.body as Phaser.Physics.Arcade.Body

    const maxTiltX = 30
    const maxTiltY = 10 // much smaller range — slight tilt = full throttle/brake
    const maxSpeed = 300
    const dt = delta / 1000

    const clampedX = Phaser.Math.Clamp(this.gyroX, -maxTiltX, maxTiltX)
    const clampedY = Phaser.Math.Clamp(this.gyroY - this.betaOffset, -maxTiltY, maxTiltY)

    // X: tilt maps directly to velocity — instant direction change
    body.setAccelerationX(0)
    body.setVelocityX((clampedX / maxTiltX) * maxSpeed)

    // Y: locked — ship stays fixed on screen, world scrolls instead
    body.setAccelerationY(0)
    body.setVelocityY(0)

    // Forward/back tilt accelerates or decelerates scroll speed
    this.elapsedTime += dt
    const { minScroll, maxScroll, asteroidExtraSpeed } = difficultyAt(this.elapsedTime)
    const scrollAccel = 150 // px/s²
    this.scrollSpeed = Phaser.Math.Clamp(
      this.scrollSpeed + (-clampedY / maxTiltY) * scrollAccel * dt,
      minScroll,
      maxScroll
    )

    // Track distance for spawn rate
    this.distanceTraveled += this.scrollSpeed * dt

    // Scroll stars downward at current speed; horizontal parallax from lateral movement
    for (const star of this.stars) {
      star.y += this.scrollSpeed * dt
      star.x -= body.velocity.x * 0.3 * dt
      if (star.x < 0) star.x += 360
      if (star.x > 360) star.x -= 360
      if (star.y < 0) star.y += 640
      if (star.y > 640) star.y -= 640
    }

    // --- Asteroid spawning ---
    this.timeSinceLastSpawn += delta
    const interval = spawnIntervalMs(this.distanceTraveled)
    if (this.timeSinceLastSpawn >= interval) {
      this.timeSinceLastSpawn = 0
      this.spawnAsteroid()
    }

    // --- Move asteroids & check collisions ---
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i]

      // Scroll down with the world + extra speed from difficulty + parallax
      a.y += (this.scrollSpeed + asteroidExtraSpeed) * dt
      a.x -= body.velocity.x * 0.3 * dt
      a.x += (a.getData('driftX') as number) * dt

      // Wrap horizontally
      if (a.x < -30) a.x += 420
      if (a.x > 390) a.x -= 420

      // Remove if off screen below
      if (a.y > 700) {
        a.destroy()
        this.asteroids.splice(i, 1)
        continue
      }

      // Triangle-vs-rectangle collision check against the ship
      // Ship sprite is 32×32, centered — triangle vertices match the drawn pixels
      const halfW = this.ship.displayWidth / 2
      const halfH = this.ship.displayHeight / 2
      const shipTri: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [
        { x: this.ship.x, y: this.ship.y - halfH },           // top center
        { x: this.ship.x - halfW, y: this.ship.y + halfH },   // bottom-left
        { x: this.ship.x + halfW, y: this.ship.y + halfH },   // bottom-right
      ]
      const ab = a.body as Phaser.Physics.Arcade.Body
      if (triangleRectOverlap(shipTri, { x: ab.x, y: ab.y, w: ab.width, h: ab.height })) {
        this.die()
        return
      }
    }

    // Update vertical tilt indicator — pip moves along the track
    const tiltRatio = clampedY / maxTiltY // -1 (forward) to 1 (back)
    this.tiltIndicator.y = 320 + tiltRatio * 50 // ±50px from center
    // Color: green when tilting forward (speeding up), red when back (slowing)
    this.tiltIndicator.fillColor = tiltRatio < 0 ? 0x00ff00 : 0xff4444

    // Update speedometer bar
    const speedRatio = (this.scrollSpeed - minScroll) / (maxScroll - minScroll)
    const barWidth = speedRatio * 80
    this.speedBar.width = barWidth
    // Color shifts from white to yellow to red as speed increases
    if (speedRatio < 0.5) {
      this.speedBar.fillColor = 0xffffff
    } else if (speedRatio < 0.8) {
      this.speedBar.fillColor = 0xffff00
    } else {
      this.speedBar.fillColor = 0xff4444
    }
    this.speedLabel.setText(`${this.scrollSpeed.toFixed(0)}`)
  }

  private spawnAsteroid() {
    const x = spawnXNearPlayer(this.ship.x)
    const { w, h } = randomAsteroidSize()
    // Grey color with slight variation
    const grey = Phaser.Math.Between(0x55, 0x99)
    const color = (grey << 16) | (grey << 8) | grey

    const asteroid = this.add.rectangle(x, -h, w, h, color)
    this.physics.add.existing(asteroid)
    const ab = asteroid.body as Phaser.Physics.Arcade.Body
    ab.setImmovable(true)

    // Each asteroid gets a small random horizontal drift for ambient floating
    asteroid.setData('driftX', Phaser.Math.Between(-30, 30))

    this.asteroids.push(asteroid)
  }

  private die() {
    this.dead = true
    const body = this.ship.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
    this.ship.setAlpha(0.4)

    // Notify React to show game-over overlay
    const distance = Math.floor(this.distanceTraveled / 100) // score in "meters"
    this.onGameOver?.(distance)
  }

  getDistanceScore(): number {
    return Math.floor(this.distanceTraveled / 100)
  }

  destroy() {
    window.removeEventListener('deviceorientation', this.handleOrientation.bind(this))
  }
}
