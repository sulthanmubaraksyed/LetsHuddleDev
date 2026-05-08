-- LetsHuddle Sample Seed Data
-- Run this after applying schema.sql to populate demo data

-- ─── Users ───────────────────────────────────────────────────────────────────
INSERT INTO users (id, email, display_name, role) VALUES
  ('user_admin_001',   'admin@letshuddle.app',   'Alex Admin',    'admin'),
  ('user_manager_001', 'manager@letshuddle.app', 'Morgan Manager','manager'),
  ('user_001',         'jane@letshuddle.app',    'Jane Smith',    'user'),
  ('user_002',         'john@letshuddle.app',    'John Doe',      'user')
ON CONFLICT (id) DO NOTHING;

-- ─── Huddles ─────────────────────────────────────────────────────────────────
INSERT INTO huddles (id, name, day, date, location, status, created_by) VALUES
  ('huddle_001', 'Sprint 21 Planning', 'Monday',    '2026-05-11 09:00:00+00', 'Conference Room A', 'planned',     'user_admin_001'),
  ('huddle_002', 'Mid-Sprint Review',  'Wednesday', '2026-05-13 14:00:00+00', 'Zoom',              'planned',     'user_admin_001'),
  ('huddle_003', 'Sprint 20 Retro',    'Friday',    '2026-05-02 15:00:00+00', 'Conference Room B', 'completed',   'user_manager_001'),
  ('huddle_004', 'Bug Bash',           'Thursday',  '2026-05-08 10:00:00+00', 'War Room',          'in_progress', 'user_manager_001')
ON CONFLICT (id) DO NOTHING;

-- ─── Tasks ───────────────────────────────────────────────────────────────────
INSERT INTO tasks (id, name, description, assigned_user_id, assigned_user_name, due_date, status, created_by) VALUES
  ('task_001', 'Design new login page',           'Redesign login/signup with new brand guidelines',   'user_001', 'Jane Smith',    '2026-05-10 00:00:00+00', 'in_progress', 'user_admin_001'),
  ('task_002', 'Fix payment gateway bug',         'Payment fails for cards with non-US billing',       'user_002', 'John Doe',     '2026-05-08 00:00:00+00', 'blocked',     'user_admin_001'),
  ('task_003', 'Write API documentation',         'Document all v2 API endpoints in OpenAPI format',   'user_001', 'Jane Smith',    '2026-05-15 00:00:00+00', 'not_started', 'user_manager_001'),
  ('task_004', 'Set up staging environment',      'Configure staging server with CI/CD pipeline',      'user_002', 'John Doe',     '2026-05-07 00:00:00+00', 'completed',   'user_admin_001'),
  ('task_005', 'User acceptance testing',         'Run UAT for new checkout flow with 5 users',        'user_001', 'Jane Smith',    '2026-05-12 00:00:00+00', 'not_started', 'user_manager_001'),
  ('task_006', 'Migrate database to Neon',        'Move from legacy Postgres to Neon serverless',      'user_002', 'John Doe',     '2026-05-09 00:00:00+00', 'in_progress', 'user_admin_001'),
  ('task_007', 'Update dependency versions',      'Audit and upgrade all npm packages',                'user_001', 'Jane Smith',    '2026-05-14 00:00:00+00', 'not_started', 'user_manager_001'),
  ('task_008', 'Performance profiling',           'Profile and fix slow Firestore queries',            'user_002', 'John Doe',     '2026-05-06 00:00:00+00', 'completed',   'user_admin_001')
ON CONFLICT (id) DO NOTHING;

-- ─── HuddleTasks ─────────────────────────────────────────────────────────────
INSERT INTO huddle_tasks (id, huddle_id, task_id, "order", added_by) VALUES
  ('ht_001', 'huddle_001', 'task_001', 1, 'user_admin_001'),
  ('ht_002', 'huddle_001', 'task_003', 2, 'user_admin_001'),
  ('ht_003', 'huddle_001', 'task_005', 3, 'user_admin_001'),
  ('ht_004', 'huddle_002', 'task_007', 1, 'user_manager_001'),
  ('ht_005', 'huddle_004', 'task_002', 1, 'user_manager_001'),
  ('ht_006', 'huddle_004', 'task_006', 2, 'user_manager_001'),
  ('ht_007', 'huddle_003', 'task_004', 1, 'user_admin_001'),
  ('ht_008', 'huddle_003', 'task_008', 2, 'user_admin_001')
ON CONFLICT (id) DO NOTHING;
