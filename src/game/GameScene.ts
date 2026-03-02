import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Rectangle
  private debugText!: Phaser.GameObjects.Text
  private gyroX = 0
  private gyroY = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // Create the ship (green square for now)
    this.ship = this.add.rectangle(180, 500, 40, 40, 0x00ff00)
    this.physics.add.existing(this.ship)

    const body = this.ship.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)

    // Debug text to show gyro values
    this.debugText = this.add.text(10, 10, 'Gyro: waiting...', {
      fontSize: '14px',
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

  update() {
    const body = this.ship.body as Phaser.Physics.Arcade.Body

    // Map gyro tilt to velocity
    // gamma (left/right) controls X, clamped and scaled
    // beta (forward/back) controls Y, but inverted so tilting forward moves up
    const sensitivity = 10
    const maxTilt = 30

    const clampedX = Phaser.Math.Clamp(this.gyroX, -maxTilt, maxTilt)
    const clampedY = Phaser.Math.Clamp(this.gyroY - 45, -maxTilt, maxTilt) // -45 assumes phone held at ~45 degree angle

    body.setVelocityX(clampedX * sensitivity)
    body.setVelocityY(clampedY * sensitivity)

    // Update debug text
    this.debugText.setText(
      `Gyro X: ${this.gyroX.toFixed(1)}\n` +
      `Gyro Y: ${this.gyroY.toFixed(1)}\n` +
      `Ship: ${this.ship.x.toFixed(0)}, ${this.ship.y.toFixed(0)}`
    )
  }

  destroy() {
    window.removeEventListener('deviceorientation', this.handleOrientation.bind(this))
  }
}
