export const colors = {
  // ─── Backgrounds ───────────────────────────────────────────────────────────
  background: '#f8faf6',          // Elite Pitch surface (slight green tint)
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceContainer: '#eceeeb',
  surfaceContainerLow: '#f2f4f1',

  // ─── Borders ───────────────────────────────────────────────────────────────
  border: '#e1e3e0',
  borderStrong: '#bfc9c3',

  // ─── Primary — Deep Emerald ────────────────────────────────────────────────
  accent: '#003527',              // kept as "accent" for all existing references
  primary: '#003527',             // deep emerald
  primaryDark: '#002419',
  primaryContainer: '#064e3b',    // slightly lighter emerald
  primaryFixed: '#b0f0d6',        // mint highlight
  primaryFixedDim: '#95d3ba',
  accentDim: 'rgba(0,53,39,0.08)',
  accentMed: 'rgba(0,53,39,0.16)',

  // ─── Secondary — Slate ────────────────────────────────────────────────────
  secondary: '#404944',
  secondaryContainer: '#d0e1fb',

  // ─── Text hierarchy ────────────────────────────────────────────────────────
  textPrimary: '#191c1b',
  textSecondary: '#404944',
  textMuted: '#707974',
  textOnPrimary: '#ffffff',

  // ─── Semantic ─────────────────────────────────────────────────────────────
  error: '#ba1a1a',
  errorDim: 'rgba(186,26,26,0.08)',
  errorContainer: '#ffdad6',
  warning: '#C27C00',
  warningDim: 'rgba(194,124,0,0.10)',
  success: '#003527',
  successDim: 'rgba(0,53,39,0.08)',
  orange: '#C45200',
  orangeDim: 'rgba(196,82,0,0.08)',

  // ─── Glassmorphism ─────────────────────────────────────────────────────────
  glass: 'rgba(255,255,255,0.92)',
  glassBorder: 'rgba(255,255,255,0.5)',
  glassOverlay: 'rgba(248,250,246,0.85)',
};

export const PLAYERS = [
  'Yamila Dilhara',
  'Chanuka de Silva',
  'Sathush Nanayakkara',
  'Achala Shashvika',
  'Chanindu Maneth',
  'Nidula Hansaja',
  'Ravindu Nanayakkara',
  'Dulshan Thanoj',
  'Savindu Weerarathna',
  'Dinal Chamith',
  'Farhan Navufal',
  'Siluna Sathmina',
  'Madhawa Aloka',
  'Anjitha Kaveendra',
  'Dihindu Nimsath',
  'Shalom Dilsara',
  'Ayesh Jeewantha',
  'Eesara Kovinda',
  'Saveen Nanayakkara',
  'Reshan Kavinga',
  'Ovindu',
  'Diyatha',
  'Adithya',
];

export const OVERS_OPTIONS = [5, 10, 15, 20, 30, 50];

export const DISMISSAL_TYPES = [
  'bowled',
  'caught',
  'lbw',
  'runOut',
  'stumped',
  'hitWicket',
  'retired',
];

export const DISMISSAL_LABELS = {
  bowled: 'Bowled',
  caught: 'Caught',
  lbw: 'LBW',
  runOut: 'Run Out',
  stumped: 'Stumped',
  hitWicket: 'Hit Wicket',
  retired: 'Retired',
};

export const ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'cricket2024';
export const SECURE_STORE_KEY = 'frontyard_admin_auth';
export const SECURE_STORE_PASSWORD_KEY = 'frontyard_admin_password';
