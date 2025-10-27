/** @type {import('tailwindcss').Config} */
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
        // カスタムグレースケール（既存のdesignSystemから）
        primary: {
          DEFAULT: '#404040',
          hover: '#262626',
        },
        // セマンティックカラー
        background: {
          light: '#FAFAFA',
          dark: '#0F0F0F',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1A1A1A',
        },
        border: {
          light: '#E5E5E5',
          dark: '#333333',
        },
      },
      boxShadow: {
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'dark-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}