// Configuración base que comparten todas las ramas
export interface BranchConfig {
  name: string;
  idCountry: number;
  displayName: string;
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
    }>;
  };
  showScenario?: boolean;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  station?: {
    showClimateIndicator: boolean;
  };
  spatial?: {
    showClimateIndicator: boolean;
    showClimateData: boolean;
    showHydrologicalIndicator: boolean;
  };
  data?: {
    center: [number, number];
    zoom: number;
  };
}

export const getDefaultConfig = (): BranchConfig => ({
  name: "default",
  idCountry: 1,
  displayName: "AClimate",
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
  data: {
    center: [4.6097, -74.0817],
    zoom: 6,
  },
});
