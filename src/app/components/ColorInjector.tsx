"use client";

/**
 * This component injects a script that applies colors from configuration
 * BEFORE React hydration to prevent flash of incorrect colors
 */
export function ColorInjector() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Get country name from environment or default
            const countryName = "${process.env.NEXT_PUBLIC_COUNTRY_NAME || 'El Salvador'}".toLowerCase();
            
            // Color configurations by country
            const colors = {
              salvador: {
                primary: '#023e74',
                secondary: '#0287d9',
                accent: '#a3a749',
                tertiary: '#f2a20e',
                textLight: '#171717',
                textDark: '#ffffff',
                gradientStart: '#023e74',
                gradientEnd: '#0287d9',
                success: '#a3a749',
                primaryRgb: '2, 62, 116',
                secondaryRgb: '2, 135, 217',
                accentRgb: '163, 167, 73',
              },
              honduras: {
                primary: '#bc6c25',
                secondary: '#dda15e',
                accent: '#fefae0',
                tertiary: '#8b4513',
                textLight: '#171717',
                textDark: '#ffffff',
                gradientStart: '#bc6c25',
                gradientEnd: '#dda15e',
                success: '#16a34a',
                primaryRgb: '188, 108, 37',
                secondaryRgb: '221, 161, 94',
                accentRgb: '254, 250, 224',
              },
              nicaragua: {
                primary: '#1e3a8a',
                secondary: '#2563eb',
                accent: '#f59e0b',
                tertiary: '#8b5cf6',
                textLight: '#171717',
                textDark: '#ffffff',
                gradientStart: '#1e3a8a',
                gradientEnd: '#2563eb',
                success: '#16a34a',
                primaryRgb: '30, 58, 138',
                secondaryRgb: '37, 99, 235',
                accentRgb: '245, 158, 11',
              },
              amazonia: {
                primary: '#065f46',
                secondary: '#10b981',
                accent: '#fbbf24',
                tertiary: '#f59e0b',
                textLight: '#171717',
                textDark: '#ffffff',
                gradientStart: '#065f46',
                gradientEnd: '#10b981',
                success: '#16a34a',
                primaryRgb: '6, 95, 70',
                secondaryRgb: '16, 185, 129',
                accentRgb: '251, 191, 36',
              },
            };
            
            // Get the appropriate colors
            let selectedColors = colors.salvador; // default
            if (countryName.includes('honduras')) {
              selectedColors = colors.honduras;
            } else if (countryName.includes('nicaragua')) {
              selectedColors = colors.nicaragua;
            } else if (countryName.includes('amazonia') || countryName.includes('sat')) {
              selectedColors = colors.amazonia;
            }
            
            // Apply CSS variables to root
            const root = document.documentElement;
            Object.entries(selectedColors).forEach(([key, value]) => {
              const cssVar = '--color-' + key
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase();
              if (key.includes('Rgb')) {
                root.style.setProperty('--color-' + key.replace('Rgb', '').replace(/([A-Z])/g, '-$1').toLowerCase() + '-rgb', value);
              } else {
                root.style.setProperty(cssVar, value);
              }
            });
          })();
        `,
      }}
    />
  );
}
