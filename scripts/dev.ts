import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import qrcode from 'qrcode-terminal'
import path from 'path'

const certDir = path.join(import.meta.dirname, '..', 'certs')
const certPath = path.join(certDir, 'cert.pem')
const keyPath = path.join(certDir, 'key.pem')

// Get Tailscale hostname
function getTailscaleHostname(): string | null {
  try {
    const status = execSync('tailscale status --json', { encoding: 'utf-8' })
    const parsed = JSON.parse(status)
    return parsed.Self.DNSName.replace(/\.$/, '')
  } catch {
    return null
  }
}

function ensureCerts(hostname: string | null) {
  if (existsSync(certPath) && existsSync(keyPath)) {
    return
  }

  console.log('  Generating mkcert certificates...')

  try {
    execSync('which mkcert', { stdio: 'ignore' })
  } catch {
    console.error('  ERROR: mkcert not found. Install it with: brew install mkcert && mkcert -install')
    process.exit(1)
  }

  mkdirSync(certDir, { recursive: true })

  const domains = ['localhost', '127.0.0.1']
  if (hostname) domains.unshift(hostname)

  execSync(
    `mkcert -cert-file "${certPath}" -key-file "${keyPath}" ${domains.join(' ')}`,
    { stdio: 'inherit' }
  )

  console.log('  Certificates generated.\n')
}

// Get mkcert CA path
function getMkcertCAPath(): string {
  const caRoot = execSync('mkcert -CAROOT', { encoding: 'utf-8' }).trim()
  return path.join(caRoot, 'rootCA.pem')
}

const hostname = getTailscaleHostname()
const port = 5173

console.log('\n')
console.log('='.repeat(55))
console.log('  STARLIGHT DEV SERVER')
console.log('='.repeat(55))

ensureCerts(hostname)

if (hostname) {
  const url = `https://${hostname}:${port}`

  console.log(`\n  Scan this QR code with your phone:\n`)

  qrcode.generate(url, { small: true }, (code) => {
    console.log(code)
    console.log(`\n  URL: ${url}`)
    console.log('\n  Requirements:')
    console.log('  1. Phone must have Tailscale app installed & connected')
    console.log('  2. Phone must trust the mkcert CA certificate')
    console.log(`\n  CA cert: ${getMkcertCAPath()}`)
    console.log('  (AirDrop to phone, then install in Settings > General > VPN & Device Management)')
    console.log('='.repeat(55))
    console.log('\n')
  })
} else {
  console.log('\n  WARNING: Tailscale not running or not connected')
  console.log('  Run: tailscale up')
  console.log('='.repeat(55))
  console.log('\n')
}

// Start Vite
const vite = spawn('pnpm', ['exec', 'vite'], {
  stdio: 'inherit',
  shell: true,
})

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err)
  process.exit(1)
})
