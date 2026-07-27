// src/theme/index.js
// Central design tokens — single source of truth for the whole app.
// Changing brand colors, spacing, or radius happens ONLY here.

export const COLORS = {
  // Brand — Circle Network Orange, expressed as a gradient pair
  gradientStart: '#FF8A3D',
  gradientEnd: '#EA560F',
  primary: '#EA560F',
  primarySoft: '#FFF1E8',
  primarySoftBorder: '#FFD9BC',

  // Status — traffic light system (used everywhere identically)
  green: '#1B9C5A',
  greenSoft: '#E7F8EF',
  greenSoftBorder: '#BEEAD1',

  yellow: '#C48A0A',
  yellowSoft: '#FFF7E0',
  yellowSoftBorder: '#F5E1A0',

  red: '#E0392F',
  redSoft: '#FDEBEA',
  redSoftBorder: '#F5C2BE',

  // Neutrals
  bg: '#F6F5F8',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFAFC',
  border: '#ECEAF1',
  ink: '#181521',
  inkSoft: '#5B5768',
  inkMuted: '#9C97A8',
  white: '#FFFFFF',
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 };

export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };

export const SHADOW = {
  card: {
    shadowColor: '#1A1023',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  button: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  soft: {
    shadowColor: '#1A1023',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
};

// Type scale — pair with Inter (loaded via @expo-google-fonts/inter)
export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export function statusColors(level) {
  switch (level) {
    case 'green':
      return { main: COLORS.green, soft: COLORS.greenSoft, border: COLORS.greenSoftBorder };
    case 'yellow':
      return { main: COLORS.yellow, soft: COLORS.yellowSoft, border: COLORS.yellowSoftBorder };
    case 'red':
    default:
      return { main: COLORS.red, soft: COLORS.redSoft, border: COLORS.redSoftBorder };
  }
}

export const STATUS_ICON = {
  green: 'checkmark-circle',
  yellow: 'alert-circle',
  red: 'close-circle',
};
