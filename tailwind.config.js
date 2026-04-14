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
        // Mondrian 3原色 — 派生・alpha 乗算禁止の固定値
        mondrian: {
          red:         p.mondrian.red,
          yellow:      p.mondrian.yellow,
          blue:        p.mondrian.blue,
          black:       p.mondrian.black,
          canvas:      p.mondrian.canvas,
          orange:      p.mondrian.orange,
          orangeLight: p.mondrian.orangeLight,
        },
        // セマンティックカラー (Mondrian Matte)
        primary: {
          DEFAULT: p.mondrian.black,
          hover:   p.gray[800],
        },
        background: {
          light: p.mondrian.canvas,
          dark:  '#121212',
        },
        surface: {
          light: p.gray.white,
          dark:  '#1C1C1C',
        },
        border: {
          light: p.mondrian.black,
          dark:  p.mondrian.canvas,
        },
      },
      boxShadow: {
        // マット質感: 多層シャドウ廃止、最小限の 1px 影のみ
        'sm': `0 1px 0 rgba(10, 10, 10, 0.04)`,
        'md': `0 1px 0 rgba(10, 10, 10, 0.06)`,
        'lg': `0 2px 0 rgba(10, 10, 10, 0.08)`,
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
