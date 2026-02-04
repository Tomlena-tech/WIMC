const tintColorLight = '#4285F4';
const tintColorDark = '#fff';

const Colors = {
  light: {
    text: '#212121',
    background: '#F5F5F5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,

    // Couleurs WIMC
    primary: '#4285F4',      // Bleu
    success: '#4CAF50',      // Vert "En sécurité"
    warning: '#FF9800',      // Orange "Attention"
    white: '#FFFFFF',
    cardBg: '#FFFFFF',
    textSecondary: '#757575',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    // Couleurs WIMC (même en dark)
    primary: '#4285F4',
    success: '#4CAF50',
    warning: '#FF9800',
    white: '#FFFFFF',
    cardBg: '#1E1E1E',
    textSecondary: '#B0B0B0',
  },
};

export { Colors };
export default Colors;
