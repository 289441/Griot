// Every fixed choice in the app, shared by the forms, the feed checker and the risk maths.
export const HOLDINGS = {
  bank: 'Bank account',
  fintech: 'Fintech or mobile money app',
  exchange: 'Crypto exchange',
  bitcoin: 'Bitcoin in my own wallet',
  cash: 'Physical cash',
  foreign_currency: 'Foreign currency or stablecoins',
} as const

export const EARNINGS = {
  salary: 'Salary from a local employer',
  freelance_foreign: 'Freelance or remote work paid from abroad',
  business: 'My own business',
  remittance: 'Money sent by family abroad',
  crypto: 'Crypto trading or payments',
  other: 'Something else',
} as const

// Each category is both a kind of alert and a possible biggest worry.
export const CATEGORIES = {
  freeze: 'My account being frozen',
  capital_controls: 'Limits on moving my money',
  exchange_ban: 'Crypto exchanges being banned',
  central_bank: 'New central bank rules',
  devaluation: 'My currency losing value',
} as const

export const RISKS = { low: 'Low', medium: 'Medium', high: 'High' } as const
export const STATUSES = { confirmed: 'Confirmed', rumor: 'Rumor' } as const

export const COUNTRIES: Record<string, string> = {
  AR: 'Argentina',
  AU: 'Australia',
  BR: 'Brazil',
  CA: 'Canada',
  CN: 'China',
  EG: 'Egypt',
  FR: 'France',
  DE: 'Germany',
  GH: 'Ghana',
  IN: 'India',
  ID: 'Indonesia',
  IT: 'Italy',
  KE: 'Kenya',
  LB: 'Lebanon',
  MX: 'Mexico',
  NL: 'Netherlands',
  NG: 'Nigeria',
  PK: 'Pakistan',
  PH: 'Philippines',
  RU: 'Russia',
  ZA: 'South Africa',
  ES: 'Spain',
  TR: 'Turkey',
  GB: 'United Kingdom',
  US: 'United States',
  VE: 'Venezuela',
  OTHER: 'Somewhere else',
}
