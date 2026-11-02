import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-content-center justify-items-center gap-4 p-6 text-center">
      <h1 className="font-display text-3xl font-extrabold">Page not found</h1>
      <Link className="rounded-pill bg-accent px-6 py-3 font-bold text-on-accent no-underline" href="/">
        Go home
      </Link>
    </div>
  )
}
