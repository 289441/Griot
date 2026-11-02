// Publishing blocks: words and links that must never appear in an alert.

// Official places an alert may link to. Add a site here only after checking it by hand.
const OFFICIAL_HOSTS = [
  'bankofengland.co.uk',
  'bcra.gob.ar',
  'binance.com',
  'bis.org',
  'bitcoincore.org',
  'bitso.com',
  'bitstamp.net',
  'blockchain.com',
  'blockstream.com',
  'btcpayserver.org',
  'cbn.gov.ng',
  'centralbank.go.ke',
  'coinbase.com',
  'coinkite.com',
  'crypto.com',
  'ecb.europa.eu',
  'electrum.org',
  'federalreserve.gov',
  'fincen.gov',
  'gemini.com',
  'github.com',
  'kraken.com',
  'ledger.com',
  'luno.com',
  'rbi.org.in',
  'river.com',
  'sec.gov',
  'spk.gov.tr',
  'strike.me',
  'trezor.io',
  'wise.com',
]

const WALLET_ADDRESSES = [
  /\b(bc1|tb1|lq1|ex1)[a-z0-9]{20,}\b/i, // Bitcoin and Liquid
  /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/, // older Bitcoin
  /\bln(bc|tb)[a-z0-9]{20,}\b/i, // Lightning invoices
  /\b0x[a-f0-9]{40}\b/i, // Ethereum style
]

const LINKS_IN_TEXT = /(https?:\/\/|www\.|\b(bit\.ly|t\.co|tinyurl\.com)\b)/i

const SEND_FUNDS =
  /\b(send|transfer|move|deposit)\b.{0,40}\b(to|into)\b.{0,20}\b(this|our|the following|safe|secure)\b.{0,20}\b(address|wallet|account)\b/i

const ASKS_FOR_SECRETS =
  /\b(enter|share|type|send|give|confirm|verify|import)\b.{0,30}\b(seed|recovery|mnemonic|private key)/i

// "Never type your recovery words" is good advice, so warnings are allowed.
const IS_WARNING = /\b(never|do not|don't|no real)\b/i

export function isOfficialSource(link: string) {
  const { hostname } = new URL(link)
  return OFFICIAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

// Lists why a piece of alert text is unsafe. An empty list means it passed.
export function textProblems(text: string): string[] {
  const problems: string[] = []
  if (WALLET_ADDRESSES.some((pattern) => pattern.test(text))) problems.push('contains a wallet address')
  if (LINKS_IN_TEXT.test(text)) problems.push('contains a link')
  if (SEND_FUNDS.test(text)) problems.push('tells people where to send funds')
  if (ASKS_FOR_SECRETS.test(text) && !IS_WARNING.test(text)) problems.push('asks for recovery words')
  return problems
}
