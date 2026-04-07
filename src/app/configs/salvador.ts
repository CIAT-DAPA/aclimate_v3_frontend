import { BranchConfig } from "./base";

export const salvadorConfig: BranchConfig = {
  name: "salvador",
  idCountry: 5,
  displayName: "AClimate El Salvador",
  aboutUs: {
    title: "Sobre la herramienta",
    description: `AClimate El Salvador es una plataforma web especializada en el análisis de datos climáticos históricos espaciales desarrollada en el marco del proyecto "Fortaleciendo la Resiliencia Climática de Comunidades Rurales y de los Ecosistemas en Ahuachapán Sur-El Salvador". 
Proporciona acceso a información climática procesada de fuentes como Copernicus (AgEra5 v2) y CHIRPS v3, facilitando la toma de decisiones en el sector agropecuario, especialmente ante la creciente vulnerabilidad frente a fenómenos como El Niño-Oscilación del Sur (ENOS) y eventos hidrometeorológicos extremos.`,
    projectTitle: "Fortaleciendo la Resiliencia Climática",
    projectDescription: `Esta herramienta forma parte del estudio sobre "investigación y diseño de productos climáticos" ejecutado por la Alianza Bioversity International–CIAT, financiado por el Fondo de Adaptación y administrado por el Programa de las Naciones Unidas para el Desarrollo (PNUD).

El proyecto responde a la creciente exposición de El Salvador a los impactos del cambio climático, donde la frecuencia de eventos extremos ha aumentado dramáticamente: de un evento por década en los años sesenta-setenta, a ocho eventos en la última década. 

Siguiendo el enfoque de la Organización Meteorológica Mundial (OMM), la plataforma no solo proporciona datos meteorológicos, sino que añade valor a través de la interpretación y comunicación para la toma de decisiones, especialmente para productores agrícolas, técnicos municipales y organismos locales en la región sur de Ahuachapán.`,
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
        name: "Ministerio de Medio Ambiente y Recursos Naturales (MARN)",
        url: "https://www.snet.gob.sv",
        logo: "/assets/img/partners/MARN.jpg",
        alt: "MARN logo",
      },
      {
        name: "Programa de las Naciones Unidas para el Desarrollo (PNUD)",
        url: "https://www.undp.org/es",
        logo: "/assets/img/partners/pnud.jpg",
        alt: "PNUD logo",
      }
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
    showClimateData: true,
    showHydrologicalIndicator: false,
  },
  data: {
    center: [13.69, -89.19],
    zoom: 8,
  },
    analytics: { 
    gaId: "G-JXD6Z5RXSZ",
  }
};
