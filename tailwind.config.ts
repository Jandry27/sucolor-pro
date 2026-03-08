/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                display: ['Inter', 'SF Pro Display', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            colors: {
                brand: {
                    // Primary orange (Neo-Lux vibrant suorange)
                    orange: '#FF6A00',
                    'orange-hover': '#E55F00',
                    'orange-soft': 'rgba(255, 106, 0, 0.10)',
                    'orange-border': 'rgba(255, 106, 0, 0.20)',
                    // Text
                    'text-primary': '#0B1220',
                    'text-secondary': 'rgba(11,18,32,0.65)',
                    'text-tertiary': 'rgba(11,18,32,0.40)',
                    // Backgrounds
                    white: '#FFFFFF',
                    subtle: '#F7F8FA',
                    // Borders
                    border: 'rgba(15,23,42,0.08)',
                    'border-strong': 'rgba(15,23,42,0.14)',
                    // Backward-compat aliases
                    black: '#FFFFFF',
                    dark: '#F7F8FA',
                    'dark-2': '#FFFFFF',
                    'dark-3': '#F2F4F7',
                    'dark-4': '#EAECF0',
                    gray: '#D1D5DB',
                    'gray-light': '#6B7280',
                    'gray-lighter': 'rgba(11,18,32,0.50)',
                    // Status colors
                    success: '#16A34A',
                    warning: '#F59E0B',
                    error: '#EF4444',
                }
            },
            backgroundImage: {
                'orange-gradient': 'linear-gradient(135deg, #FF6A00 0%, #E55F00 100%)',
                'subtle-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F7F8FA 100%)',
            },
            boxShadow: {
                'card': '0 20px 50px -12px rgba(0, 0, 0, 0.08)',
                'card-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                'orange': '0 10px 30px -5px rgba(255, 106, 0, 0.3)',
                'orange-sm': '0 4px 14px 0 rgba(255, 106, 0, 0.39)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'dark': '0 4px 24px rgba(0,0,0,0.08)',
                'nav': '0 1px 0 rgba(15,23,42,0.08)',
                'dropdown': '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            },
            borderRadius: {
                'card': '24px',
                'btn': '12px',
                'chip': '999px',
                'modal': '32px',
                '3xl': '24px',
                '4xl': '32px',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'fade-up': 'fadeUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'shimmer': 'shimmer 1.8s linear infinite',
                'pulse-orange': 'pulseOrange 2s ease-in-out infinite',
                'progress': 'progressFill 0.6s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.96)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                pulseOrange: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 106, 0, 0.3)' },
                    '50%': { boxShadow: '0 0 0 6px rgba(255, 106, 0, 0)' },
                },
                progressFill: {
                    '0%': { width: '0%' },
                    '100%': { width: '100%' },
                },
            },
        },
    },
    plugins: [],
}
