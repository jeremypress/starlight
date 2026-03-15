import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const certDir = path.join(import.meta.dirname, 'certs')

function getHttpsConfig() {
  const certPath = path.join(certDir, 'cert.pem')
  const keyPath = path.join(certDir, 'key.pem')

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('Using mkcert certificates')
    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    }
  }

  console.warn('Certificates not found in certs/')
  return undefined
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: getHttpsConfig(),
  },
})
