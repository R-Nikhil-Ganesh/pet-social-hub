export const colors = {
  bg: {
    app: '#FFFDF9',
    surface: '#FFFFFF',
    subtle: '#FFF1E6',
    muted: '#F5F5F7',
  },
  text: {
    primary: '#1E1C2A',
    secondary: '#5D5A71',
    muted: '#8B89A0',
    inverse: '#FFFFFF',
  },
  brand: {
    primary: '#F97316',
    primaryDark: '#EA580C',
    secondary: '#0EA5A5',
    accent: '#E11D48',
  },
  border: {
    soft: 'rgba(0,0,0,0.04)',
    strong: '#D8D3E1',
  },
  state: {
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 12,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 30,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 18,
    base: 21,
    relaxed: 24,
  },
  letterSpacing: {
    header: -0.4,
    body: 0,
  },
};

export const shadows = {
  card: {
    shadowColor: '#121021',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const motion = {
  fast: 140,
  normal: 220,
  slow: 320,
};
