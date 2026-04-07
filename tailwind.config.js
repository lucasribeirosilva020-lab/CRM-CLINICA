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
                    DEFAULT: '#1B4332',
                    50: '#D8F3DC',
                    100: '#B7E4C7',
                    200: '#95D5B2',
                    300: '#74C69D',
                    400: '#2D6A4F',
                    500: '#1B4332',
                    600: '#163A2B',
                    700: '#113024',
                    800: '#0C271D',
                    900: '#081E16',
                },
                secondary: {
                    DEFAULT: '#D8F3DC',
                    50: '#F0FBF1',
                    100: '#E8F8EA',
                    200: '#D8F3DC',
                    300: '#B7E4C7',
                    400: '#95D5B2',
                    500: '#74C69D',
                    600: '#52B788',
                    700: '#40916C',
                    800: '#2D6A4F',
                    900: '#1B4332',
                },
                slate: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A',
                },
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                border: '#E5E7EB',
                text: {
                    DEFAULT: '#1A1A1A',
                    muted: '#6B7280',
                    light: '#9CA3AF',
                },
                background: '#F5F5F0',
                surface: '#FFFFFF',
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
