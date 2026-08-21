import { BranchConfig } from "./base";

export const guatemalaConfig: BranchConfig = {
  name: "guatemala",
  idCountry: 6,
  displayName: "AClimate Guatemala",
  aboutUs: {
    title: "Sobre la herramienta",
    description: `AClimate Guatemala es una plataforma web especializada en el análisis de datos climáticos históricos espaciales.
Proporciona acceso a información climática procesada de fuentes como Copernicus (AgEra5 v2) y CHIRPS v3, facilitando la toma de decisiones en el sector agropecuario y la planificación territorial.`,
    projectTitle: "Programa de Acción Climática del CGIAR (CASP)",
    projectDescription: `AClimate Guatemala forma parte de las acciones del Programa de Acción Climática del CGIAR (CASP) para fortalecer los servicios de información climática y apoyar la toma de decisiones basada en evidencia. La plataforma automatiza el procesamiento de datos climáticos, desde la descarga y validación hasta la generación de climatologías e indicadores, facilitando el acceso a información climática histórica de alta calidad para investigadores, instituciones técnicas, servicios de extensión y tomadores de decisiones en Guatemala. Asimismo, contribuye al desarrollo y escalamiento de servicios climáticos centrados en el usuario en el marco de la iniciativa Next Wave.`,
    projectLink: "https://www.aclimate.org/",
    partnersTitle: "Socios",
    partners: [
      {
        name: "Alliance Bioversity-CIAT",
        url: "https://alliancebioversityciat.org/",
        logo: "/assets/img/partners/alliance.png",
        alt: "Alliance Bioversity-CIAT logo",
      },
            {
        name: "Consultative Group on International Agricultural Research (CGIAR)",
        url: "https://cgiar.org/",
        logo: "/assets/img/partners/cgiar.png",
        alt: "CGIAR logo",
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