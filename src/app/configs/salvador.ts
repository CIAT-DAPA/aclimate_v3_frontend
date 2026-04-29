import { BranchConfig } from "./base";

export const salvadorConfig: BranchConfig = {
  name: "salvador",
  idCountry: 5,
  displayName: "AClimate El Salvador",
  aboutUs: {
    title: "Sobre la herramienta",
    description: `AClimate El Salvador es una plataforma web especializada diseñada como una interfaz de usuario intuitiva para democratizar el acceso a productos climáticos en Ahuachapán Sur. Su objetivo principal es fortalecer la toma de decisiones en gestión sostenible de los recursos naturales y de Agricultura Sostenible Adaptada al Clima,  ante la creciente vulnerabilidad climática, especialmente frente a fenómenos como el Niño-Oscilación del Sur (ENOS) y eventos hidrometeorológicos extremos. 

La plataforma integra de manera estratégica datos de pronósticos oficiales y análisis históricos espaciales del DOA – MARN, complementándolos con información procesada de fuentes globales de alta precisión como Copernicus (AgEra5 v2) y CHIRPS v3. `,
    projectTitle: "Fortaleciendo la Resiliencia Climática de Comunidades Rurales y de los Ecosistemas en Ahuachapán Sur-El Salvador",
    projectDescription: `Esta plataforma se ha desarrollado en el marco del estudio sobre “investigación y diseño de productos climáticos”, ejecutado por La Alianza Bioversity International–CIAT, y hace parte del El Proyecto “Fortaleciendo la Resiliencia Climática de Comunidades Rurales y de los Ecosistemas en Ahuachapán Sur-El Salvador”, financiado por el Fondo de Adaptación, administrado por el Programa de las Naciones Unidas para el Desarrollo (PNUD) y ejecutado por el Ministerio de Medio Ambiente y Recursos Naturales (MARN). `,
    projectLink: "https://www.undp.org/es/el-salvador/proyectos/fortaleciendo-la-resiliencia-climatica-de-comunidades-rurales-y-de-los-ecosistemas-en-ahuachapan-sur",
    partnersTitle: "Socios",
    partners: [
      {
        name: "Alliance Bioversity-CIAT",
        url: "https://alliancebioversityciat.org/es",
        logo: "/assets/img/partners/alliance.png",
        alt: "Alliance Bioversity-CIAT logo",
      },
      {
        name: "Ministerio de Medio Ambiente y Recursos Naturales (MARN)",
        url: "https://www.marn.gob.sv/",
        logo: "/assets/img/partners/MARN.jpg",
        alt: "MARN logo",
      },
      {
        name: "Programa de las Naciones Unidas Para el Desarrollo (PNUD)",
        url: "https://www.undp.org/es",
        logo: "/assets/img/partners/pnud.jpg",
        alt: "PNUD logo",
      },
      {
        name: "Fondo de Adaptación",
        url: "https://www.adaptation-fund.org",
        logo: "/assets/img/partners/pnud.jpg",
        alt: "Fondo de Adaptación logo",
      },
    ],
  },
  showScenario: false,
  colors: {
    primary: "#bc6c25",
    secondary: "#dda15e",
    accent: "#fefae0",
  },
  spatial: {
    showClimateIndicator: true,
    showAgroclimaticIndicator: false,
    showClimateData: true,
    showHydrologicalIndicator: false,
    showForecastPctChange: false,
  },
  data: {
    center: [13.69, -89.19],
    zoom: 10,
  },
  analytics: {
    gaId: "G-JXD6Z5RXSZ",
  },
};
