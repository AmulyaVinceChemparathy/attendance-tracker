import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#667eea',
    secondary: '#764ba2',
    surface: '#ffffff',
    background: '#f8fafc',
    error: '#e53e3e',
    success: '#38a169',
    warning: '#d69e2e',
    text: '#2d3748',
    textSecondary: '#718096',
  },
  roundness: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#2d3748',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#2d3748',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#2d3748',
    },
    body: {
      fontSize: 16,
      color: '#4a5568',
    },
    caption: {
      fontSize: 14,
      color: '#718096',
    },
  },
};

