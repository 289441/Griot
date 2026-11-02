// Bundles the service worker, including the signature check and our public key.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const path = (file) => fileURLToPath(new URL(`../${file}`, import.meta.url))
if (existsSync(path('.env.local'))) process.loadEnvFile(path('.env.local'))

await build({
  entryPoints: [path('sw/sw.js')],
  outfile: path('public/sw.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2022',
  define: { ALERT_PUBKEY: JSON.stringify(process.env.NEXT_PUBLIC_ALERT_PUBKEY ?? '') },
})
console.log('Built public/sw.js')
