import { BranchConfig } from "./base";


export const colombiaConfig: BranchConfig = {
  name: "colombia",
  idCountry: 1,
  displayName: "AClimate Colombia",
  aboutUs: {
    title: "Sobre la herramienta",
    description:
      "AClimate Colombia es una plataforma web que reúne información climática y agroclimática para apoyar la toma de decisiones en los cultivos de arroz y maíz. Permite consultar datos históricos y escenarios, y está pensada para incorporar pronósticos agroclimáticos a medida que estén disponibles.",
    projectTitle: "Sobre el proyecto",
    projectDescription: `Esta plataforma es desarrollada por el Centro Internacional de Agricultura Tropical (CIAT), la Federación Nacional de Arroceros (FEDEARROZ), la Federación Nacional de Cafeteros de Colombia, la Federación Nacional de Cultivadores de Cereales y Leguminosas (FENALCE) y el Instituto de Hidrología, Meteorología y Estudios Ambientales (IDEAM), con el apoyo de la Agencia de los Estados Unidos para el Desarrollo Internacional (USAID). Los métodos y modelos utilizados para generar la información se encuentran en proceso de prueba y validación, aunque han mostrado un buen desempeño. Inicialmente la plataforma cubre seis municipios de Colombia para maíz y arroz, y los gremios continuarán utilizándola para ofrecer la posibilidad de incorporar otros municipios y variedades.`,
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
        name: "FEDEARROZ",
        url: "https://www.fedearroz.com.co/",
        logo: "/assets/img/partners/fedearroz.png",
        alt: "FEDEARROZ logo",
      },
      {
        name: "Federación Nacional de Cafeteros de Colombia",
        url: "https://federaciondecafeteros.org/",
        logo: "/assets/img/partners/cafeteros.png",
        alt: "Federación Nacional de Cafeteros de Colombia logo",
      },
      {
        name: "FENALCE",
        url: "https://www.fenalce.co/",
        logo: "/assets/img/partners/fenalce.png",
        alt: "FENALCE logo",
      },
      {
        name: "IDEAM",
        url: "https://www.ideam.gov.co/",
        logo: "/assets/img/partners/ideam.png",
        alt: "IDEAM logo",
      },
      {
        name: "USAID",
        url: "https://www.usaid.gov/",
        logo: "/assets/img/partners/usaid.png",
        alt: "USAID logo",
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
