/**
 * TailAdmin Design Tokens
 *
 * Constants for testing TailAdmin styling compliance
 */

// Color tokens
export const COLORS = {
  // Brand colors
  brand: {
    50: '#EEF4FF',
    100: '#E0EAFF',
    200: '#C7D7FE',
    300: '#A4BCFD',
    400: '#8098F9',
    500: '#465FFF',
    600: '#444CE7',
    700: '#3538CD',
  },

  // Gray palette
  gray: {
    50: '#F9FAFB',
    100: '#F2F4F7',
    200: '#E4E7EC',
    300: '#D0D5DD',
    400: '#98A2B3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1D2939',
    900: '#101828',
    950: '#0C111D',
  },

  // Semantic colors
  success: {
    50: '#ECFDF3',
    100: '#D1FADF',
    400: '#32D583',
    500: '#12B76A',
    600: '#039855',
    700: '#027A48',
  },

  error: {
    50: '#FEF3F2',
    100: '#FEE4E2',
    400: '#F97066',
    500: '#F04438',
    600: '#D92D20',
    700: '#B42318',
  },

  warning: {
    50: '#FFFAEB',
    100: '#FEF0C7',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
  },

  info: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    400: '#36BFFA',
    500: '#0BA5EC',
    600: '#0086C9',
    700: '#026AA2',
  },

  // Dark mode specific
  grayDark: '#1A2231',
  bodyDark: '#0D121C',
};

// RGB values for computed style comparisons
export const RGB_COLORS = {
  brand500: 'rgb(70, 95, 255)',
  brand600: 'rgb(68, 76, 231)',
  brand400: 'rgb(128, 152, 249)',
  brand50: 'rgb(238, 244, 255)',
  gray50: 'rgb(249, 250, 251)',
  gray100: 'rgb(242, 244, 247)',
  gray200: 'rgb(228, 231, 236)',
  gray400: 'rgb(152, 162, 179)',
  gray500: 'rgb(102, 112, 133)',
  gray700: 'rgb(52, 64, 84)',
  gray800: 'rgb(29, 41, 57)',
  gray900: 'rgb(16, 24, 40)',
  gray950: 'rgb(12, 17, 29)',
  grayDark: 'rgb(26, 34, 49)',
  bodyDark: 'rgb(13, 18, 28)',
  success50: 'rgb(236, 253, 243)',
  success500: 'rgb(18, 183, 106)',
  success700: 'rgb(2, 122, 72)',
  error50: 'rgb(254, 243, 242)',
  error500: 'rgb(240, 68, 56)',
  error700: 'rgb(180, 35, 24)',
  warning50: 'rgb(255, 250, 235)',
  warning500: 'rgb(247, 144, 9)',
  warning700: 'rgb(181, 71, 8)',
  info50: 'rgb(240, 249, 255)',
  info500: 'rgb(11, 165, 236)',
  info700: 'rgb(2, 106, 162)',
  white: 'rgb(255, 255, 255)',
  transparent: 'rgba(0, 0, 0, 0)',
};

// Shadow tokens
export const SHADOWS = {
  themeXs: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
  themeSm: '0px 1px 3px 0px rgba(16, 24, 40, 0.10), 0px 1px 2px -1px rgba(16, 24, 40, 0.10)',
  themeMd: '0px 4px 6px -1px rgba(16, 24, 40, 0.10), 0px 2px 4px -2px rgba(16, 24, 40, 0.10)',
  themeLg: '0px 10px 15px -3px rgba(16, 24, 40, 0.10), 0px 4px 6px -4px rgba(16, 24, 40, 0.10)',
  themeXl: '0px 20px 25px -5px rgba(16, 24, 40, 0.10), 0px 8px 10px -6px rgba(16, 24, 40, 0.10)',
  card: '0px 1px 3px 0px rgba(16, 24, 40, 0.06), 0px 1px 2px -1px rgba(16, 24, 40, 0.03)',
  cardHover: '0px 4px 8px -2px rgba(16, 24, 40, 0.10), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
  dropdown: '0px 12px 16px -4px rgba(16, 24, 40, 0.10), 0px 4px 6px -2px rgba(16, 24, 40, 0.05)',
  none: 'none',
};

// Border radius tokens
export const BORDER_RADIUS = {
  sm: '6px',
  md: '8px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
};

// Spacing tokens
export const SPACING = {
  sidebar: {
    width: '288px', // w-72
  },
  header: {
    height: '64px', // h-16
  },
  card: {
    padding: '24px', // p-6
  },
  table: {
    cellPaddingX: '20px', // px-5
    cellPaddingY: '16px', // py-4
  },
};

// Typography tokens
export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Z-index tokens
export const Z_INDEX = {
  dropdown: '50',
  header: '999',
  sidebar: '9999',
  modal: '9999',
};
