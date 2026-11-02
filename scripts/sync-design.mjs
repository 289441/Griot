// Turns design-system/tokens.json into app/tokens.css. design-system/ is the source of truth; never edit the output.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(join(root, 'design-system', 'tokens.json'), 'utf8'))
const [day, night] = tokens.color.themes.map((theme) => theme.id)

// One theme's value, with {alias} turned into var(--alias)
const value = (v, theme) => (typeof v === 'string' ? v : v[theme]).replace(/^\{(.+)\}$/, 'var(--$1)')
const lines = (list, format, pad = '  ') => list.map((t) => `${pad}${format(t)}`).join('\n')

const colors = tokens.color.tokens
const shadows = tokens.shadow.tokens
const themed = [...colors, ...shadows]
const radii = tokens.radius.tokens
const nightOnly = themed.filter((t) => typeof t.value !== 'string' && t.value[day] !== t.value[night])
const nightLine = (t) => `--${t.name}: ${value(t.value, night)};`

const css = `/* Griot. Generated from design-system/tokens.json by scripts/sync-design.mjs. Do not edit. */

:root {
  color-scheme: light;
${lines(themed, (t) => `--${t.name}: ${value(t.value, day)};`)}
${lines(tokens.size.tokens, (t) => `--${t.name}: ${t.value};`)}
}

/* Night follows the device's dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
${lines(nightOnly, nightLine, '    ')}
  }
}

/* A section can always be night on its own, like the level 3 alarm */
[data-theme="${night}"] {
  color-scheme: dark;
${lines(nightOnly, nightLine)}
}

/* Radii use Tailwind's names: rounded-pill, rounded-card */
@theme static {
${lines(radii, (t) => `--${t.name}: ${t.value};`)}
}

/* Utilities follow the theme: bg-surface, text-ink, shadow-elev-1 */
@theme inline {
${lines(colors, (t) => `--color-${t.name}: var(--${t.name});`)}
${lines(shadows, (t) => `--shadow-${t.name}: var(--${t.name});`)}
}
`

writeFileSync(join(root, 'app', 'tokens.css'), css)
console.log(`design: ${colors.length} colours and ${shadows.length} shadows in ${day} and ${night}, ${radii.length} radii`)
