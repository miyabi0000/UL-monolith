/** @type {import('tailwindcss').Config} */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const p = require('./client/styles/tokens/primitives.cjs');

export default {
  content: [
    "./client/index.html",
    "./client/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ダークモードをクラスベースで有効化
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Tailwind 標準クラス（text-gray-900 など）をトークンへ一致させる
        gray: {
          50: p.gray[50],
          100: p.gray[100],
          200: p.gray[200],
          300: p.gray[300],
          400: p.gray[400],
          500: p.gray[500],
          600: p.gray[600],
          700: p.gray[700],
          800: p.gray[800],
          900: p.gray[900],
        },
        red: {
          50: p.red[50],
          100: p.red[100],
          200: p.red[200],
          300: p.red[300],
          400: p.red[400],
          500: p.red[500],
          600: p.red[600],
          700: p.red[700],
          800: p.red[800],
          900: p.red[900],
        },
        green: {
          50: p.green[50],
          100: p.green[100],
          200: p.green[200],
          300: p.green[300],
          400: p.green[400],
          500: p.green[500],
          600: p.green[600],
          700: p.green[700],
          800: p.green[800],
          900: p.green[900],
        },
        orange: {
          50: p.orange[50],
          100: p.orange[100],
          200: p.orange[200],
          300: p.orange[300],
          400: p.orange[400],
          500: p.orange[500],
          600: p.orange[600],
          700: p.orange[700],
          800: p.orange[800],
          900: p.orange[900],
        },
        blue: {
          50: p.blue[50],
          100: p.blue[100],
          200: p.blue[200],
          300: p.blue[300],
          400: p.blue[400],
          500: p.blue[500],
          600: p.blue[600],
          700: p.blue[700],
          800: p.blue[800],
          900: p.blue[900],
        },
        purple: {
          50: p.purple[50],
          100: p.purple[100],
          200: p.purple[200],
          300: p.purple[300],
          400: p.purple[400],
          500: p.purple[500],
          600: p.purple[600],
          700: p.purple[700],
          800: p.purple[800],
          900: p.purple[900],
        },
        // トークンから取得（designSystem.ts の COLORS と整合）
        primary: {
          DEFAULT: p.gray[700],
          hover: p.gray[800],
        },
        // セマンティックカラー
        background: {
          light: p.gray[50],
          dark: p.gray[900],
        },
        surface: {
          light: p.gray.white,
          dark: p.gray[800],
        },
        border: {
          light: p.gray[200],
          dark: p.gray[700],
        },
      },
      boxShadow: {
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'dark-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'glass-sm': '0 8px 24px rgba(20, 28, 40, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        'glass-md': '0 16px 40px rgba(20, 28, 40, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      },
      backdropBlur: {
        glass: '14px',
        'glass-strong': '22px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
