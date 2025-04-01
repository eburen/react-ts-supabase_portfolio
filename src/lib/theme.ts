// Theme configuration for the application
export const theme = {
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },
};

// Common styling functions
export const getGradientText = (from: string, to: string) => {
  return `bg-gradient-to-r from-${from} to-${to} text-transparent bg-clip-text`;
};

// Reusable component classes
export const componentClasses = {
  button: {
    primary: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
    secondary: 'inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
  },
  card: 'bg-white shadow-md rounded-lg overflow-hidden',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  heading: {
    h1: 'text-4xl font-extrabold tracking-tight sm:text-5xl',
    h2: 'text-3xl font-bold tracking-tight',
    h3: 'text-2xl font-bold tracking-tight',
  },
};

export default {
  theme,
  getGradientText,
  componentClasses,
}; 