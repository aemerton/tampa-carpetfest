// Colors carried over from the original mockup (theme.css / tailwind.config.js).
export const colors = {
  bg: "#1A1F14",
  surface: "#25291C",
  surfaceRaised: "#2F3424",
  border: "#3A4030",
  accent: "#9ACD32",
  onAccent: "#1A1F14",
  text: "#D3D3D3",
  textMuted: "#9AA08C",
  danger: "#E5735C",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 6,
  md: 10,
  pill: 999,
};

// Soft green glow around profile photos (mockup's ProfilePhoto boxShadow).
export const glow = {
  shadowColor: colors.accent,
  shadowOpacity: 0.8,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 0 },
  elevation: 8,
};
