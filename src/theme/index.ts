import { DefaultTheme } from "@react-navigation/native";
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const colors = {
  primary: "#17c100ff", // Neon green
  secondary: "#FF0000", // Neon red
  background: "#121212",
  surface: "#1E1E1E",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  border: "#333333",
  error: "#FF3B30",
  success: "#148932ff",
  warning: "#FF9500",
  info: "#007AFF",
  transparent: "transparent",
  surfaceVariant: "#2D2D2D", // Added surfaceVariant color
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
};

export const dimensions = {
  width,
  height,
  isSmallDevice: width < 375,
};

export const navigationTheme = {
  dark: true,
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
} as const;

export default {
  colors,
  spacing,
  radius,
  typography,
  width,
  height,
  navigationTheme,
};
