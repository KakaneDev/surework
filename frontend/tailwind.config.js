/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Modern Teal/Cyan Primary Palette
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',  // Main
          600: '#0d9488',  // Hover
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Cyan Accent
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // Main
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Emerald Success
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',  // Main
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Amber Warning
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Main
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Red Error
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Main
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Slate Neutrals (cleaner than neutral)
        neutral: {
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
        // Dark mode surfaces using slate
        dark: {
          bg: '#0f172a',      // slate-900
          surface: '#1e293b', // slate-800
          elevated: '#334155', // slate-700
          border: '#475569'   // slate-600
        },
        // Sidebar colors - darker slate
        sidebar: {
          bg: '#0f172a',      // slate-900
          hover: 'rgba(255,255,255,0.05)',
          active: 'rgba(20,184,166,0.1)' // primary-500 with opacity
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        'dropdown': '0 4px 16px rgba(0,0,0,0.15)',
        'sidebar': '2px 0 8px rgba(0,0,0,0.1)'
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem'
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem'
      },
      // =======================================================================
      // Animation System - Standardized durations, easings, and keyframes
      // =======================================================================

      // Transition durations (standardized)
      transitionDuration: {
        'instant': '0ms',
        'fast': '150ms',      // Micro-interactions
        'normal': '200ms',    // Default
        'slow': '300ms',      // Larger elements
        'slower': '500ms'     // Complex animations
      },

      // Easing functions
      transitionTimingFunction: {
        'in': 'cubic-bezier(0.4, 0, 1, 1)',       // Accelerate (exits)
        'out': 'cubic-bezier(0, 0, 0.2, 1)',      // Decelerate (enters)
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)', // Smooth (hovers)
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' // Playful
      },

      // Transition properties
      transitionProperty: {
        'none': 'none',
        'all': 'all',
        'DEFAULT': 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
        'opacity': 'opacity',
        'shadow': 'box-shadow',
        'transform': 'transform',
        'gpu': 'transform, opacity',              // GPU-accelerated only
        'gpu-shadow': 'transform, opacity, box-shadow', // GPU + shadow
        'height': 'height',
        'spacing': 'margin, padding'
      },

      // Animation delays for staggered effects
      transitionDelay: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms'
      },

      // Custom animations
      animation: {
        // Fade animations
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 150ms ease-in',
        'fade-in-fast': 'fadeIn 150ms ease-out',
        'fade-in-slow': 'fadeIn 300ms ease-out',

        // Slide animations
        'slide-up': 'slideUp 200ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
        'slide-left': 'slideLeft 200ms ease-out',
        'slide-right': 'slideRight 200ms ease-out',
        'slide-up-fade': 'slideUpFade 300ms ease-out',
        'slide-down-fade': 'slideDownFade 300ms ease-out',

        // Scale animations
        'scale-in': 'scaleIn 200ms ease-out',
        'scale-out': 'scaleOut 150ms ease-in',
        'scale-up': 'scaleUp 200ms ease-out',
        'scale-down': 'scaleDown 200ms ease-out',

        // Bounce animations
        'bounce-in': 'bounceIn 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-subtle': 'bounceSubtle 400ms ease-out',

        // Shake animation (for errors)
        'shake': 'shake 500ms ease-in-out',

        // Pulse animations
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',

        // Spin variations
        'spin-slow': 'spin 1.5s linear infinite',
        'spin-fast': 'spin 0.5s linear infinite',

        // Progress bar (GPU-accelerated with scaleX)
        'progress': 'progress 300ms ease-out forwards',

        // Skeleton loading
        'skeleton': 'skeleton 1.5s ease-in-out infinite'
      },

      // Keyframe definitions
      keyframes: {
        // Fade
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },

        // Slide
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideLeft: {
          '0%': { transform: 'translateX(8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideRight: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideUpFade: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDownFade: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },

        // Scale
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' }
        },
        scaleUp: {
          '0%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' }
        },
        scaleDown: {
          '0%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        },

        // Bounce
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },

        // Shake (for validation errors)
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
        },

        // Progress (GPU-accelerated using scaleX)
        progress: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(var(--progress, 1))' }
        },

        // Skeleton loading shimmer
        skeleton: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
