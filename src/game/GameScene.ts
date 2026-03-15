import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Rectangle
  private debugText!: Phaser.GameObjects.Text
  private gyroX = 0
  private gyroY = 0
  private stars: Phaser.GameObjects.Rectangle[] = []
  private scrollSpeed = 100 // px/s, controlled by forward/back tilt
  private tiltIndicator!: Phaser.GameObjects.Rectangle
  private speedBar!: Phaser.GameObjects.Rectangle
  private speedLabel!: Phaser.GameObjects.Text

  constructor(private betaOffset: number) {
    super({ key: 'GameScene' })
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

    // Create the ship (red square for now)
    this.ship = this.add.rectangle(180, 500, 40, 40, 0xff0000)
    this.physics.add.existing(this.ship)

    const body = this.ship.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
    body.setMaxVelocity(300)

    // Debug text to show gyro values
    this.debugText = this.add.text(10, 10, 'Gyro: waiting...', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    })

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

  update(_time: number, delta: number) {
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
    const minScroll = 80
    const maxScroll = 500
    const scrollAccel = 150 // px/s²
    this.scrollSpeed = Phaser.Math.Clamp(
      this.scrollSpeed + (-clampedY / maxTiltY) * scrollAccel * dt,
      minScroll,
      maxScroll
    )

    // Scroll stars downward at current speed; horizontal parallax from lateral movement
    for (const star of this.stars) {
      star.y += this.scrollSpeed * dt
      star.x -= body.velocity.x * 0.3 * dt
      if (star.x < 0) star.x += 360
      if (star.x > 360) star.x -= 360
      if (star.y < 0) star.y += 640
      if (star.y > 640) star.y -= 640
    }

    // Update vertical tilt indicator — pip moves along the track
    const tiltRatio = clampedY / maxTiltY // -1 (forward) to 1 (back)
    this.tiltIndicator.y = 320 + tiltRatio * 50 // ±50px from center
    // Color: green when tilting forward (speeding up), red when back (slowing)
    this.tiltIndicator.fillColor = tiltRatio < 0 ? 0x00ff00 : 0xff4444

    // Update speedometer bar
    const minScroll2 = minScroll
    const maxScroll2 = maxScroll
    const speedRatio = (this.scrollSpeed - minScroll2) / (maxScroll2 - minScroll2)
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

    // Update debug text
    this.debugText.setText(
      `Gyro X: ${this.gyroX.toFixed(1)}\n` +
      `Gyro Y: ${this.gyroY.toFixed(1)}\n` +
      `Scroll: ${this.scrollSpeed.toFixed(0)} px/s`
    )
  }

  destroy() {
    window.removeEventListener('deviceorientation', this.handleOrientation.bind(this))
  }
}
