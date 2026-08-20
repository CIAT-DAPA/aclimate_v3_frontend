import { BranchConfig } from "./base";

export const guatemalaConfig: BranchConfig = {
  name: "guatemala",
  idCountry: 6,
  displayName: "AClimate Guatemala",
  aboutUs: {
    title: "Sobre la herramienta",
    description: `AClimate Guatemala es una plataforma web especializada en el análisis de datos climáticos históricos espaciales.
Proporciona acceso a información climática procesada de fuentes como Copernicus (AgEra5 v2) y CHIRPS v3, facilitando la toma de decisiones en el sector agropecuario y la planificación territorial.`,
    projectTitle: "AgriLAC",
    projectDescription: `AClimate Guatemala forma parte de la iniciativa AClimate que busca democratizar el acceso a información climática de calidad en América Latina y el Caribe.

La plataforma automatiza el procesamiento de datos desde la descarga hasta la visualización, incluyendo resampling, validación, cálculos mensuales y climatologías. Esto permite a usuarios de diferentes sectores acceder fácilmente a datos históricos espaciales y cálculos de indicadores climáticos para Guatemala.`,
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
  station: {
    showClimateIndicator: false,
  },
  spatial: {
    showClimateIndicator: true,
    showAgroclimaticIndicator: false,
    showClimateData: true,
    showHydrologicalIndicator: false,
    showForecastPctChange: false,
  },
  data: {
    center: [15.78, -90.23],
    zoom: 7,
  },
  analytics: {
    gaId: "G-VNS0MQM7K8",
  },
};