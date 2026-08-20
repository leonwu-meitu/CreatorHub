-- CreatorHub milestone 7: track application decision email delivery.

alter table public.creator_applications
  add column if not exists decision_email_status text
    check (decision_email_status in ('accepted', 'declined')),
  add column if not exists decision_email_sent_at timestamptz,
  add column if not exists decision_email_attempted_at timestamptz,
  add column if not exists decision_email_error text;

comment on column public.creator_applications.decision_email_status is
  'Application status represented by the most recently delivered decision email.';

comment on column public.creator_applications.decision_email_sent_at is
  'Timestamp of the most recently delivered application decision email.';

comment on column public.creator_applications.decision_email_error is
  'Latest email delivery error for Team troubleshooting; cleared after success.';
