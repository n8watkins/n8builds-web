-- Announcements (lib/announce/, docs/DATABASE.md): the owner emails the
-- confirmed waitlist people of one project from the admin dashboard, through
-- the Announcements entrypoint (worker/index.js). At most one per project
-- every 30 days.

CREATE TABLE waitlist_announcements (
  -- 32 hex characters (a random UUID without dashes).
  id TEXT PRIMARY KEY CHECK (length(id) = 32),
  project TEXT NOT NULL CHECK (length(project) BETWEEN 1 AND 40),
  template TEXT NOT NULL CHECK (template IN ('open', 'progress', 'launched')),
  -- JSON: the template's fields as the owner sent them (subject, title, body, ...).
  fields TEXT NOT NULL,
  subject TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('sending', 'paused_cap', 'done', 'cancelled')),
  -- Confirmed people on the project when it started (the snapshot it goes to).
  total INTEGER NOT NULL DEFAULT 0,
  -- Kept here, not counted from the recipients, so they survive someone
  -- leaving (their row goes with them) and the recipients' cleanup.
  sent INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  -- The last refusal from mailroom (a code such as cap_app_day), for the owner.
  last_error TEXT,
  -- When the cron next picks it up (ISO); null once it is done or cancelled.
  next_run_at TEXT,
  created_at TEXT NOT NULL,
  -- The owner's login, from the admin.
  created_by TEXT NOT NULL CHECK (length(created_by) BETWEEN 1 AND 100),
  finished_at TEXT
);
CREATE INDEX waitlist_announcements_project ON waitlist_announcements (project, created_at);
CREATE INDEX waitlist_announcements_state ON waitlist_announcements (state, next_run_at);

-- Who an announcement goes to, and how far it got: a run that stops resumes
-- where it left off and never sends anyone the same announcement twice.
-- Someone who leaves the waitlist takes their rows with them (cascade).
CREATE TABLE waitlist_announcement_recipients (
  announcement_id TEXT NOT NULL REFERENCES waitlist_announcements (id) ON DELETE CASCADE,
  subscriber_id TEXT NOT NULL REFERENCES waitlist_subscribers (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  -- When it was sent, failed or skipped (ISO).
  done_at TEXT,
  -- mailroom's code for a failed send (suppressed, ...).
  error TEXT,
  PRIMARY KEY (announcement_id, subscriber_id)
) WITHOUT ROWID;
CREATE INDEX waitlist_announcement_recipients_status ON waitlist_announcement_recipients (announcement_id, status);
CREATE INDEX waitlist_announcement_recipients_subscriber ON waitlist_announcement_recipients (subscriber_id);
CREATE INDEX waitlist_announcement_recipients_sent ON waitlist_announcement_recipients (status, done_at);

-- Every start, cancel and test send, with who did it. No personal data
-- beyond the owner's login.
CREATE TABLE waitlist_announcement_audit (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (length(actor) BETWEEN 1 AND 100),
  action TEXT NOT NULL CHECK (action IN ('start', 'cancel', 'test')),
  announcement_id TEXT,
  project TEXT NOT NULL,
  -- JSON: what the action was about (subject, total, result).
  detail TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX waitlist_announcement_audit_at ON waitlist_announcement_audit (at);
