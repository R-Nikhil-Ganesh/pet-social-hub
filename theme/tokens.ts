export const colors = {
  bg: {
    app: '#FFF2FB',
    surface: '#FFE8F8',
    subtle: '#FFD6F1',
    muted: '#F8DAFF',
  },
  text: {
    primary: '#421245',
    secondary: '#6D2D7A',
    muted: '#9A64A3',
    inverse: '#FFFFFF',
  },
  brand: {
    primary: '#FF4FA3',
    primaryDark: '#E63A92',
    secondary: '#22D3EE',
    accent: '#FFCF5A',
  },
  border: {
    soft: 'rgba(194,83,255,0.16)',
    strong: '#DE9DF0',
  },
  state: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#F43F5E',
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
    shadowColor: '#A3197D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const motion = {
  fast: 140,
  normal: 220,
  slow: 320,
};
