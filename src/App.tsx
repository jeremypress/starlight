import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { GameScene } from './game/GameScene'

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [needsPermission, setNeedsPermission] = useState(true)

  const requestGyroscope = async () => {
    // iOS requires permission request from user gesture
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        if (permission === 'granted') {
          setNeedsPermission(false)
        }
      } catch (err) {
        console.error('Gyroscope permission denied:', err)
      }
    } else {
      // Android and desktop don't need permission
      setNeedsPermission(false)
    }
  }

  useEffect(() => {
    if (needsPermission || !containerRef.current || gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 360,
      height: 640,
      backgroundColor: '#1a1a2e',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: true,
        },
      },
      scene: [GameScene],
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [needsPermission])

  if (needsPermission) {
    return (
      <div
        onClick={requestGyroscope}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a2e',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          cursor: 'pointer',
        }}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>STARLIGHT</h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Tap to enable gyroscope</p>
      </div>
    )
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
