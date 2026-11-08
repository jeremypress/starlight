/**
 * Build the game and install it on a paired iPhone (over Wi-Fi or cable), then launch it.
 * Usage: pnpm ios:install
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const root = path.join(import.meta.dirname, '..')
const iosDir = path.join(root, 'ios')
const bundleId = 'com.jeremypress.starlight'
const appPath = path.join(iosDir, 'build/Build/Products/Debug-iphoneos/Starlight.app')

function run(cmd: string, args: string[], cwd = root) {
  console.log(`\n▸ ${cmd} ${args.join(' ')}`)
  execFileSync(cmd, args, { cwd, stdio: 'inherit' })
}

interface Device {
  identifier: string
  deviceProperties: { name: string }
  hardwareProperties: { platform: string; deviceType: string }
  connectionProperties: { pairingState: string }
}

function findPhone(): Device {
  const out = path.join(os.tmpdir(), `starlight-devices-${process.pid}.json`)
  execFileSync('xcrun', ['devicectl', 'list', 'devices', '--json-output', out], { stdio: 'ignore' })
  const devices: Device[] = JSON.parse(fs.readFileSync(out, 'utf8')).result.devices
  fs.rmSync(out)
  const phone = devices.find(
    (d) =>
      d.hardwareProperties.platform === 'iOS' &&
      d.hardwareProperties.deviceType === 'iPhone' &&
      d.connectionProperties.pairingState === 'paired',
  )
  if (!phone) {
    console.error('No paired iPhone found. Pair it once in Xcode → Window → Devices and Simulators.')
    process.exit(1)
  }
  return phone
}

const phone = findPhone()
console.log(`Target: ${phone.deviceProperties.name}`)

run('pnpm', ['build'])
run('xcodegen', [], iosDir)
run(
  'xcodebuild',
  [
    '-project', 'Starlight.xcodeproj',
    '-scheme', 'Starlight',
    '-destination', 'generic/platform=iOS',
    '-derivedDataPath', 'build',
    '-allowProvisioningUpdates',
    '-quiet',
    'build',
  ],
  iosDir,
)

try {
  run('xcrun', ['devicectl', 'device', 'install', 'app', '--device', phone.identifier, appPath])
  run('xcrun', ['devicectl', 'device', 'process', 'launch', '--device', phone.identifier, bundleId])
} catch {
  console.error('\nCould not reach the phone. Unlock it and make sure it is on the same Wi-Fi as this Mac.')
  process.exit(1)
}
console.log('\n✓ Starlight is running on your phone')
