import { BranchConfig } from "./base";

export const salvadorConfig: BranchConfig = {
  name: "salvador",
  idCountry: 5,
  displayName: "AClimate El Salvador",
  headerLogo: {
    src: "/assets/img/partners/MARN_HEADER.png",
    width: 200,
    height: 200,
  },
  aboutUs: {
    title: "Sobre la herramienta",
    description: `AClimate El Salvador es una plataforma web especializada diseñada como una interfaz de usuario intuitiva para democratizar el acceso a productos climáticos en Ahuachapán Sur. Su objetivo principal es fortalecer la toma de decisiones en gestión sostenible de los recursos naturales y de Agricultura Sostenible Adaptada al Clima,  ante la creciente vulnerabilidad climática, especialmente frente a fenómenos como el Niño-Oscilación del Sur (ENOS) y eventos hidrometeorológicos extremos. 

La plataforma integra de manera estratégica datos de pronósticos oficiales y análisis históricos espaciales del DOA – MARN, complementándolos con información procesada de fuentes globales de alta precisión como Copernicus (AgEra5 v2) y CHIRPS v3. `,
    projectTitle:
      "Fortaleciendo la Resiliencia Climática de Comunidades Rurales y de los Ecosistemas en Ahuachapán Sur-El Salvador",
    projectDescription: `Esta plataforma se ha desarrollado en el marco del estudio sobre “investigación y diseño de productos climáticos”, ejecutado por La Alianza Bioversity International–CIAT, y hace parte del El Proyecto “Fortaleciendo la Resiliencia Climática de Comunidades Rurales y de los Ecosistemas en Ahuachapán Sur-El Salvador”, financiado por el Fondo de Adaptación, administrado por el Programa de las Naciones Unidas para el Desarrollo (PNUD) y ejecutado por el Ministerio de Medio Ambiente y Recursos Naturales (MARN). `,
    projectLink:
      "https://www.undp.org/es/el-salvador/proyectos/fortaleciendo-la-resiliencia-climatica-de-comunidades-rurales-y-de-los-ecosistemas-en-ahuachapan-sur",
    partnersTitle: "Socios",
    partners: [
      {
        name: "Fondo de Adaptación",
        url: "https://www.adaptation-fund.org",
        logo: "/assets/img/partners/fadapt.png",
        alt: "Fondo de Adaptación logo",
      },

      {
        name: "Programa de las Naciones Unidas Para el Desarrollo (PNUD)",
        url: "https://www.undp.org/es",
        logo: "/assets/img/partners/pnud.png",
        alt: "PNUD logo",
      },
      {
        name: "Ahuachapán Sur Ecosistema Resilientes",
        url: "https://www.undp.org/es/el-salvador/proyectos/fortaleciendo-la-resiliencia-climatica-de-comunidades-rurales-y-de-los-ecosistemas-en-ahuachapan-sur",
        logo: "/assets/img/partners/ahuachapan.png",
        alt: "Ahuachapán Sur Ecosistema Resilientes logo",
      },
      {
        name: "Alliance Bioversity-CIAT",
        url: "https://alliancebioversityciat.org/es",
        logo: "/assets/img/partners/alliance.png",
        alt: "Alliance Bioversity-CIAT logo",
      },
      {
        name: "Ministerio de Medio Ambiente y Recursos Naturales (MARN)",
        url: "https://www.marn.gob.sv/",
        logo: "/assets/img/partners/MARN.png",
        alt: "MARN logo",
      },
    ],
    userManual: {
      url: "/assets/Manual_Navegación_Usuario_AClimate_El_Salvador_v1.0.pdf",
      title: "Manual de navegación de la plataforma",
      description:
        "Descarga el manual de uso para aprender a navegar y aprovechar todas las funcionalidades de AClimate El Salvador.",
    },
  },
  showScenario: false,
  colors: {
    primary: "#0045aa",
    secondary: "#014eff",
    accent: "#9db3e8",
    tertiary: "#f57046",
    quaternary: "#c5c8cf",
    textLight: "#ffffff",
    textDark: "#171717",
    gradientStart: "#0045aa",
    gradientEnd: "#5593ff",
    success: "#b7ee40",
  },
  chartColors: {
    temp_max: "#f57046",
    temp: "#eee152",
    temp_min: "#c5c8cf",
    prec: "#014eff",
    cloud: "#9db3e8",
    wind: "#5593ff",
    humidity: "#b7ee40",
    radiation: "#eee152",
    pressure: "#0045aa",
    water: "#014eff",
    other: "#c5c8cf",
  },
  spatial: {
    showClimateIndicator: true,
    showAgroclimaticIndicator: false,
    showClimateData: true,
    showHydrologicalIndicator: false,
    showForecastPctChange: false,
    showClimatePerspective: {
      enabled: true,
      labelKey: "spatial.climatePerspective.label",
      linkUrl: "https://www.snet.gob.sv/ver/meteorologia/pronostico/perspectivas+clima/",
      linkText: "DOA MARN",
    },
  },
  station: {
    showClimateIndicator: true,
    showForecast: true,
    forecastSource:
      "Fuente: Dirección general de observatorio de amenazas y recursos naturales (DOA) – MARN El Salvador.",
    sectionOrder: ["indicators", "forecast", "climate"],
    showClimatePerspective: {
      enabled: true,
      labelKey: "spatial.climatePerspective.label",
      linkUrl: "https://www.snet.gob.sv/ver/meteorologia/pronostico/perspectivas+clima/",
      linkText: "DOA MARN",
    },
  },
  data: {
    center: [13.69, -89.19],
    zoom: 10,
  },
  analytics: {
    gaId: "G-JXD6Z5RXSZ",
  },
  footer: {
    secondaryBranding: {
      text: "Más de AClimate",
      url: "https://www.aclimate.org/",
      logoSrc: "/assets/img/logo.png",
    },
  },
};
