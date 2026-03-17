export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4C9A7D',
          hover: '#3F846A',
          light: '#EDF6F0',
        },
        secondary: {
          DEFAULT: '#A8D5BA',
        },
        'bg-page': '#F7F6F2',
        'bg-surface': '#FFFDF9',
        'border-default': '#D8E2DA',
        'border-light': '#E6ECE7',
        'text-main': '#2F3A34',
        'text-secondary': '#6B7C73',
        'success-bg': '#E4F3E8',
        'success-text': '#3D7E58',
        'warning-bg': '#F9EFCF',
        'warning-text': '#9A7423',
        'danger-bg': '#F5DDDD',
        'danger-text': '#9A4B4B',
        'info-bg': '#DCEFE3',
        'info-text': '#3E6B55',
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        input: '12px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(47, 58, 52, 0.06)',
        'card-hover': '0 4px 20px rgba(47, 58, 52, 0.10)',
      },
    },
  },
  plugins: [],
}
