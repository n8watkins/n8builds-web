-- The owner's newsletter switch (lib/newsletter/switch.ts, docs/DATABASE.md).
-- No personal data: the newsletter's addresses live in Kit, never here.

-- One row per setting; today only k = 'switch' (v '1' on, '0' off). No row means off.
CREATE TABLE newsletter_settings (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- The admin's login that made the change.
  updated_by TEXT
);

-- Every change of the switch: on or off, when, by whom.
CREATE TABLE newsletter_switch_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  turned_on INTEGER NOT NULL CHECK (turned_on IN (0, 1)),
  at TEXT NOT NULL,
  by TEXT
);
