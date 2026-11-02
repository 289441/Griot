import { CircleEllipsis, House, Megaphone, ShieldCheck } from 'lucide-react'

const LINKS = [
  { screen: '', label: 'Home', Icon: House },
  { screen: 'plan', label: 'Plan', Icon: ShieldCheck },
  { screen: 'tell', label: 'Tell us', Icon: Megaphone },
  { screen: 'more', label: 'More', Icon: CircleEllipsis },
]

// The floating dock, always in thumb reach at the bottom centre.
export default function NavBar({ route }: { route: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-md gap-0.5 rounded-pill bg-surface p-1.5 shadow-elev-2 ring-1 ring-line"
    >
      {LINKS.map(({ screen, label, Icon }) => {
        const current = route === screen
        return (
          <a
            key={label}
            href={`#/${screen}`}
            aria-current={current ? 'page' : undefined}
            className={`flex min-h-12 flex-1 flex-col items-center justify-center rounded-pill text-xs font-bold no-underline transition-colors ${
              current ? 'bg-accent text-on-accent' : 'text-muted'
            }`}
          >
            <Icon size={20} aria-hidden />
            {label}
          </a>
        )
      })}
    </nav>
  )
}
