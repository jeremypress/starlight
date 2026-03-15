import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { GameScene } from './game/GameScene'

type Phase = 'permission' | 'calibrating' | 'playing' | 'paused'

const CALIBRATION_MS = 1500

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<GameScene | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('permission')
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

  const captureBetaAndPlay = () => {
    // Capture current beta as the "resting" offset
    betaOffsetRef.current = currentBetaRef.current ?? 45
    if (sceneRef.current) {
      sceneRef.current.setBetaOffset(betaOffsetRef.current)
      sceneRef.current.scene.resume()
    }
    setPhase('playing')
  }

  // Always track live beta so we can capture it on demand
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta !== null) currentBetaRef.current = e.beta
    }
    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
  }, [])

  // Calibration: wait CALIBRATION_MS then capture beta and start/resume playing
  useEffect(() => {
    if (phase !== 'calibrating') return
    const timeout = setTimeout(() => {
      captureBetaAndPlay()
    }, CALIBRATION_MS)
    return () => clearTimeout(timeout)
  }, [phase])

  // Create Phaser game once calibration is done (first time only)
  useEffect(() => {
    if (phase !== 'playing' || !containerRef.current || gameRef.current) return

    const scene = new GameScene(betaOffsetRef.current!)
    sceneRef.current = scene

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
      scene: [scene],
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
      sceneRef.current = null
    }
  }, [phase])

  const handlePause = () => {
    sceneRef.current?.scene.pause()
    setPhase('paused')
  }

  const handleResume = () => {
    setPhase('calibrating')
  }

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

  if (phase === 'calibrating' && !gameRef.current) {
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
        <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Hold your phone steady</p>
      </div>
    )
  }

  // Playing, paused, or recalibrating (with game visible behind)
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Pause button — bottom right */}
      {phase === 'playing' && (
        <button
          onClick={handlePause}
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            width: '40px',
            height: '40px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid #888',
            color: '#fff',
            fontSize: '18px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          ⏸
        </button>
      )}

      {/* Pause menu overlay */}
      {phase === 'paused' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            fontFamily: 'monospace',
            color: '#fff',
          }}
        >
          <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>PAUSED</p>
          <button
            onClick={handleResume}
            style={{
              padding: '12px 32px',
              background: 'transparent',
              border: '2px solid #fff',
              color: '#fff',
              fontSize: '1.1rem',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            RESUME
          </button>
        </div>
      )}

      {/* Recalibration overlay */}
      {phase === 'calibrating' && gameRef.current && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            fontFamily: 'monospace',
            color: '#fff',
          }}
        >
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Hold your phone steady</p>
        </div>
      )}
    </div>
  )
}
