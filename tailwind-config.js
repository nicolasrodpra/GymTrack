window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4be277', 'primary-container': '#22c55e', 'on-primary': '#003915', 'on-primary-container': '#004b1e',
        secondary: '#adc6ff', 'secondary-container': '#0566d9', 'on-secondary-container': '#e6ecff',
        tertiary: '#ffb5ab', surface: '#0e150e', background: '#0e150e', 'surface-container-lowest': '#091009',
        'surface-container-low': '#161d16', 'surface-container': '#1a221a', 'surface-container-high': '#242c24',
        'surface-container-highest': '#2f372e', 'surface-variant': '#2f372e', 'on-surface': '#dce5d9',
        'on-surface-variant': '#bccbb9', 'on-background': '#dce5d9', outline: '#869585', 'outline-variant': '#3d4a3d',
        error: '#ffb4ab', 'error-container': '#93000a', 'gym-card': '#1e293b', 'gym-border': '#334155'
      },
      spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '48px', 'container-max': '1200px' },
      fontFamily: { body: ['Poppins'], display: ['Poppins'], headline: ['Poppins'], label: ['Poppins'] },
      fontSize: { 'display-lg': ['48px', { lineHeight: '1.1', fontWeight: '800' }], 'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '700' }], 'headline-sm': ['20px', { lineHeight: '1.4', fontWeight: '600' }], 'body-lg': ['18px', { lineHeight: '1.55' }], 'body-md': ['16px', { lineHeight: '1.5' }], 'label-md': ['14px', { lineHeight: '1.4', fontWeight: '600' }], 'label-sm': ['12px', { lineHeight: '1.3', fontWeight: '500' }] }
    }
  }
};
