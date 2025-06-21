/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                'fade-in-up': 'fadeInUp 0.6s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
            },
            keyframes: {
                fadeInUp: {
                    '0%': {opacity: '0', transform: 'translateY(20px)'},
                    '100%': {opacity: '1', transform: 'translateY(0)'},
                },
                slideInLeft: {
                    '0%': {transform: 'translateX(-20px)', opacity: 0},
                    '100%': {transform: 'translateX(0)', opacity: 1},
                },
                slideInRight: {
                    '0%': {transform: 'translateX(20px)', opacity: 0},
                    '100%': {transform: 'translateX(0)', opacity: 1},
                },
            },
        }

    },
    plugins: [],
}