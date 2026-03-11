/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1A73E8',
                    50: '#E8F0FE',
                    100: '#D2E3FC',
                    200: '#AECBFA',
                    300: '#74A9F5',
                    400: '#4285F4',
                    500: '#1A73E8',
                    600: '#1557B0',
                    700: '#0F3F79',
                    800: '#0A2B54',
                    900: '#06192F',
                },
                secondary: '#E8F0FE',
                success: '#34A853',
                warning: '#FBBC04',
                error: '#EA4335',
                border: '#E0E0E0',
                text: {
                    DEFAULT: '#1C1C1E',
                    muted: '#6B7280',
                    light: '#9CA3AF',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '12px',
                sm: '8px',
                lg: '16px',
                xl: '20px',
                '2xl': '24px',
            },
            boxShadow: {
                soft: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                card: '0 2px 8px rgba(0,0,0,0.06)',
                modal: '0 20px 60px rgba(0,0,0,0.12)',
            },
            animation: {
                'slide-in-right': 'slideInRight 0.25s ease-out',
                'slide-in-up': 'slideInUp 0.2s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
                'spin-slow': 'spin 2s linear infinite',
            },
            keyframes: {
                slideInRight: {
                    from: { transform: 'translateX(100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                slideInUp: {
                    from: { transform: 'translateY(20px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};
