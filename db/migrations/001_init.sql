-- Published alerts, each kept as the exact signed event
create table alerts (
  id text primary key,
  event jsonb not null,
  published_at timestamptz not null default now()
);

create index alerts_published_at on alerts (published_at desc);

-- Anonymous push subscriptions. No names, no times, nothing else.
create table push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null
);
