// Configuración base que comparten todas las ramas
export interface BranchConfig {
  name: string;
  idCountry: number;
  displayName: string;
  /** Logo to show in the header. Defaults to /assets/img/logo.png if not set */
  headerLogo?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  aboutUs: {
    title: string;
    description: string;
    projectTitle: string;
    projectDescription: string;
    projectLink?: string;
    partnersTitle: string;
    partners: Array<{
      name: string;
      url: string;
      logo: string;
      alt: string;
      /** Renders the card larger and with a subtle highlight ring */
      featured?: boolean;
    }>;
  };
  showScenario?: boolean;
  /** Color scheme for the application. All colors are optional and will fall back to defaults if not provided */
  colors?: {
    /** Primary brand color - used for main buttons, links, and primary UI elements */
    primary?: string;
    /** Secondary brand color - used for secondary buttons and less prominent elements */
    secondary?: string;
    /** Accent color - used for highlights and special attention elements */
    accent?: string;
    /** Tertiary color - additional brand color */
    tertiary?: string;
    /** Quaternary color - additional brand color */
    quaternary?: string;
    /** Text color for light backgrounds - typically dark for contrast */
    textLight?: string;
    /** Text color for dark backgrounds - typically light for contrast */
    textDark?: string;
    /** Gradient start color - used in decorative gradients */
    gradientStart?: string;
    /** Gradient end color - used in decorative gradients */
    gradientEnd?: string;
    /** Green/success color for progress bars and success states */
    success?: string;
  };
  station?: {
    showClimateIndicator: boolean;
    showForecast?: boolean;
    /** Attribution / source text shown at the top of the forecast section */
    forecastSource?: string;
    /** Order of sections in the station detail page. Defaults to ["climate", "indicators"] */
    sectionOrder?: Array<"climate" | "indicators" | "forecast">;
  };
  spatial?: {
    showClimateIndicator: boolean;
    showAgroclimaticIndicator: boolean;
    showClimateData: boolean;
    showHydrologicalIndicator: boolean;
    showForecastPctChange: boolean;
  };
  data?: {
    center: [number, number];
    zoom: number;
  };
  analytics?: {
    gaId: string;
  };
}

export const getDefaultConfig = (): BranchConfig => ({
  name: "default",
  idCountry: 1,
  displayName: "AClimate",
  headerLogo: {
    src: "/assets/img/logo.png",
    alt: "AClimate logo",
    width: 32,
    height: 32,
  },
  aboutUs: {
    title: "Sobre la herramienta",
    description: `AClimate es una herramienta diseñada para apoyar la toma de decisiones en el sector agropecuario.
Proporciona la capacidad de analizar datos climáticos y generar reportes detallados para diferentes regiones.`,
    projectTitle: "Proyecto",
    projectDescription: "Descripción del proyecto.",
    partnersTitle: "Socios",
    partners: [
      {
        name: "Alliance Bioversity-CIAT",
        url: "https://alliancebioversityciat.org/",
        logo: "/assets/img/partners/alliance.png",
        alt: "Alliance Bioversity-CIAT logo",
      },
    ],
  },
  colors: {
    primary: "#283618",
    secondary: "#dda15e",
    accent: "#fefae0",
    tertiary: "#bc6c25",
    quaternary: "#dce1c8",
    textLight: "#FFFBED",
    textDark: "#1f2937",
    gradientStart: "#4b6d23",
    gradientEnd: "#283618",
    success: "#16A34A",
  },
  data: {
    center: [4.6097, -74.0817],
    zoom: 6,
  },
  analytics: {
    gaId: "G-5XT0B5ZC2P",
  },
});