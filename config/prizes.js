// Seed data only — used once, the first time the app runs, to populate the
// `prizes` database table. After that, prizes are edited from /admin.html
// and this file is never read again. Safe to leave as-is or edit before
// your very first deploy if you want different starting defaults.

const DEFAULT_PRIZES = [
  { label: 'RM50 Bonus',    color: '#1e40af', weight: 10 },
  { label: 'Free Spin',     color: '#d926aa', weight: 20 },
  { label: 'RM20 Bonus',    color: '#1e40af', weight: 20 },
  { label: 'Try Again',     color: '#d926aa', weight: 25 },
  { label: 'RM100 Bonus',   color: '#1e40af', weight: 5 },
  { label: 'RM10 Bonus',    color: '#d926aa', weight: 15 },
  { label: 'Jackpot RM500', color: '#1e40af', weight: 1 },
  { label: 'RM30 Bonus',    color: '#d926aa', weight: 14 },
];

module.exports = { DEFAULT_PRIZES };
