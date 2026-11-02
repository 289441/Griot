// Draws the Levels logo and exports every icon size. Run once with "npm run icons".
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const out = (name) => fileURLToPath(new URL(`../public/icons/${name}`, import.meta.url))

// scale shrinks the logo so maskable icons survive being cropped into a circle.
const logo = (scale, radius) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="#0f1430"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -258)">
    <path d="M66 350a190 190 0 0 1 380 0" fill="none" stroke="#2c3358" stroke-width="40" stroke-linecap="round"/>
    <path d="M126 350a130 130 0 0 1 260 0" fill="none" stroke="#ffb547" stroke-width="40" stroke-linecap="round"/>
    <path d="M186 350a70 70 0 0 1 140 0" fill="none" stroke="#ffb547" stroke-width="40" stroke-linecap="round"/>
    <circle cx="256" cy="350" r="26" fill="#f3f1ff"/>
  </g>
</svg>`

const png = (svg, size, name) =>
  sharp(Buffer.from(svg)).resize(size, size).png().toFile(out(name))

await png(logo(1, 96), 192, 'icon-192.png')
await png(logo(1, 96), 512, 'icon-512.png')
await png(logo(0.72, 0), 512, 'icon-maskable-512.png')
await png(logo(0.9, 0), 180, 'apple-touch-icon.png')
writeFileSync(out('favicon.svg'), logo(1, 96).trim())
console.log('Icons written to public/icons')
