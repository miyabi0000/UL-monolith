/** @type {import('tailwindcss').Config} */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const p = require('./client/styles/tokens/primitives.cjs');

export default {
  content: [
    "./client/index.html",
    "./client/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // Typography scale — --gear-font-* (globals.css) と整合
      fontSize: {
        '3xs':  ['9px',  { lineHeight: '1'    }],
        '2xs':  ['10px', { lineHeight: '1'    }],
        'xs':   ['11px', { lineHeight: '1.5'  }],
        'sm':   ['12px', { lineHeight: '1.5'  }],
        'base': ['14px', { lineHeight: '1.5'  }],
        'lg':   ['16px', { lineHeight: '1.35' }],
        'xl':   ['18px', { lineHeight: '1.2'  }],
        '2xl':  ['20px', { lineHeight: '1.2'  }],
      },
      colors: {
        // 使用色ファミリー: gray, red, blue, orange のみ
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
        // セマンティックカラー
        primary: {
          DEFAULT: p.gray[700],
          hover: p.gray[800],
        },
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
        'sm': `0 1px 2px rgba(27, 29, 27, 0.05)`,
        'md': `0 1px 3px rgba(27, 29, 27, 0.1), 0 1px 2px -1px rgba(27, 29, 27, 0.1)`,
        'lg': `0 4px 6px -1px rgba(27, 29, 27, 0.1), 0 2px 4px -2px rgba(27, 29, 27, 0.1)`,
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
