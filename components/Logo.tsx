// The Griot mark: three alert levels, two lit. Same drawing as the app icon.
export default function Logo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="44 138 424 240" className={className} aria-hidden>
      <path d="M66 350a190 190 0 0 1 380 0" fill="none" strokeWidth="40" strokeLinecap="round" className="stroke-line" />
      <path d="M126 350a130 130 0 0 1 260 0" fill="none" strokeWidth="40" strokeLinecap="round" className="stroke-accent" />
      <path d="M186 350a70 70 0 0 1 140 0" fill="none" strokeWidth="40" strokeLinecap="round" className="stroke-accent" />
      <circle cx="256" cy="350" r="26" className="fill-ink" />
    </svg>
  )
}
