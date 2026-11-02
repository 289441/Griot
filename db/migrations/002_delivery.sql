-- Broad topics so alerts reach only the people they affect
alter table push_subscriptions
  add column country text not null default 'OTHER',
  add column holdings text[] not null default '{}';

create index push_subscriptions_holdings on push_subscriptions using gin (holdings);

-- The small signed notice a phone checks, and how far delivery has gone
alter table alerts
  add column notice jsonb,
  add column delivered_rank smallint not null default 0;

-- Who still needs a reminder. Rows disappear once seen or finished.
create table reminders (
  alert_id text not null references alerts (id) on delete cascade,
  endpoint text not null references push_subscriptions (endpoint) on delete cascade,
  stage smallint not null default 1,
  next_at timestamptz not null,
  primary key (alert_id, endpoint)
);

create index reminders_due on reminders (next_at);
