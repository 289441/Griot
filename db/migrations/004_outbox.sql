-- Every send is a row until done, so a cut off run resumes instead of losing people
alter table reminders
  add column last_stage smallint not null default 2;
