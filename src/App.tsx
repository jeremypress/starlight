import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { GameScene } from './game/GameScene'

type Phase = 'permission' | 'calibrating' | 'playing'

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('permission')
  const [countdown, setCountdown] = useState(3)
  const currentBetaRef = useRef<number | null>(null)
  const betaOffsetRef = useRef<number | null>(null)

  const requestGyroscope = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        if (permission === 'granted') {
          setPhase('calibrating')
        }
      } catch (err) {
        console.error('Gyroscope permission denied:', err)
      }
    } else {
      setPhase('calibrating')
    }
  }

  // Track live beta during calibration
  useEffect(() => {
    if (phase !== 'calibrating') return
    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta !== null) currentBetaRef.current = e.beta
    }
    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
  }, [phase])

  // Countdown then capture beta offset
  useEffect(() => {
    if (phase !== 'calibrating') return
    setCountdown(3)
    let count = 3
    const interval = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else {
        clearInterval(interval)
        betaOffsetRef.current = currentBetaRef.current ?? 45
        setPhase('playing')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Create Phaser game once calibration is done
  useEffect(() => {
    if (phase !== 'playing' || !containerRef.current || gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 360,
      height: 640,
      backgroundColor: '#000000',
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
      scene: [new GameScene(betaOffsetRef.current!)],
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [phase])

  if (phase === 'permission') {
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
          background: '#000000',
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

  if (phase === 'calibrating') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#fff',
          fontFamily: 'monospace',
        }}
      >
        <p style={{ fontSize: '1.2rem', opacity: 0.8, marginBottom: '2rem' }}>Hold your phone steady</p>
        <p style={{ fontSize: '5rem', fontWeight: 'bold' }}>{countdown}</p>
      </div>
    )
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
