-- Pen names and verified names. Identity is a key made on the reporter's own device.
create table reporters (
  pubkey text primary key,
  name text not null unique,
  verified boolean not null default false,
  proof_url text,
  approved integer not null default 0,
  rejected integer not null default 0,
  corrected integer not null default 0
);

-- Reports wait here for review. A date, never a time, and never an IP address.
create table reports (
  id uuid primary key default gen_random_uuid(),
  receipt_hash text not null unique,
  work_hash text not null unique,
  reporter text references reporters (pubkey) on delete set null,
  body text not null,
  links text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  reason text,
  alert_id text,
  submitted_on date not null default current_date
);

create index reports_pending on reports (status, submitted_on desc);

-- Connected agents. Only the hash of their token is kept.
create table agents (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  work_hash text not null unique,
  url text,
  country text not null,
  holdings text[] not null default '{}'
);

create table agent_inbox (
  id bigserial primary key,
  agent_id uuid not null references agents (id) on delete cascade,
  message jsonb not null
);

create index agent_inbox_agent on agent_inbox (agent_id);

-- Delivery only looks at alerts that still have work to do
alter table alerts
  add column target_rank smallint not null default 0,
  add column correction_pending boolean not null default false;

create index alerts_waiting on alerts (delivered_rank, target_rank);
