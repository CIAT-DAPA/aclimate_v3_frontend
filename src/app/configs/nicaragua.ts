import { BranchConfig } from "./base";

export const nicaraguaConfig: BranchConfig = {
  name: "nicaragua",
  idCountry: 4,
  displayName: "AClimate Nicaragua",
  aboutUs: {
    title: "Sobre la herramienta",
    description: `AClimate Nicaragua es una plataforma web especializada en el análisis de datos climáticos históricos espaciales.
Proporciona acceso a información climática procesada de fuentes de estaciones de WeatherLink y da la posiblidad de hacer comparación con datos espaciales como Copernicus (AgEra5 v2) y CHIRPS v3, facilitando la toma de decisiones en el sector agropecuario y la planificación territorial.`,
    projectTitle: "AgriLAC",
    projectDescription: `AClimate Nicaragua forma parte de la iniciativa AClimate que busca democratizar el acceso a información climática de calidad en América Latina y el Caribe.

La plataforma automatiza el procesamiento de datos desde la descarga hasta la visualización, incluyendo resampling, validación, cálculos mensuales y climatologías. Esto permite a usuarios de diferentes sectores acceder fácilmente a datos históricos espaciales y cálculos de indicadores climáticos para Nicaragua.`,
    projectLink: "https://www.aclimate.org/",
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
  showScenario: false,
  colors: {
    primary: "#bc6c25",
    secondary: "#dda15e",
    accent: "#fefae0",
  },
  station: {
    showClimateIndicator: false,
  },
  spatial: {
    showClimateIndicator: false,
    showClimateData: true,
    showHydrologicalIndicator: false,
    showForecastPctChange: false,
  },
  data: {
    center: [12.8654, -85.2072],
    zoom: 7,
  },
  analytics: { 
    gaId: "G-FB2GND26MH",
  }
};
