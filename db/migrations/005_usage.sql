-- Daily totals only: how many opens, installs and setups, never who
create table usage_counts (
  day date not null,
  event text not null,
  count integer not null default 0,
  primary key (day, event)
);

-- Each count's one time token, so a solved puzzle can't be sent twice. Kept two days.
create table usage_tokens (
  token text primary key,
  made_on date not null default current_date
);
create index usage_tokens_made_on on usage_tokens (made_on);
