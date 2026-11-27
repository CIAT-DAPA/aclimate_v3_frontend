import { BranchConfig } from "./base";


export const colombiaConfig: BranchConfig = {
  name: "colombia",
  idCountry: 1,
  displayName: "AClimate Colombia",
  aboutUs: {
    title: "Sobre la herramienta",
    description:
      "AClimate Colombia es una plataforma web que reúne información climática y agroclimática para apoyar la toma de decisiones.",
    projectTitle: "Sobre el proyecto",
    projectDescription: `Esta plataforma es desarrollada por la Alianza Bioversity International & CIAT.`,
    partnersTitle: "Colaboradores",
    projectLink: "https://www.aclimate.org/",
    partners: [
      {
        name: "Alliance Bioversity-CIAT",
        url: "https://alliancebioversityciat.org/",
        logo: "/assets/img/partners/alliance.png",
        alt: "Alliance Bioversity-CIAT logo",
      },
      {
        name: "CGIAR",
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
    center: [4.6097, -74.0817],
    zoom: 6,
  },
  analytics: {
    gaId: "G-C1MB6YFRQS",
  },
};
