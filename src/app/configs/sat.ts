import { BranchConfig } from "./base";

export const amazoniaConfig: BranchConfig = {
  name: "amazonia",
  displayName: "AClimate Amazonía",
  aboutUs: {
    title: "Sobre la herramienta",
    description:
      "AClimate Amazonía es una plataforma web que ofrece información hidroclimática y agroclimática, junto con recomendaciones mensuales para el manejo de cultivos, para los departamentos de Amazonas, Caquetá y Putumayo, basada en datos y pronósticos del IDEAM.",
    projectTitle: "Contexto del Proyecto",
    projectDescription: `La plataforma hace parte de un piloto de sistema de alerta temprana multiamenaza, desarrollado por la Alianza Bioversity International-CIAT y financiado por el Programa Mundial de Alimentos, con un enfoque de diseño centrado en el ser humano dirigido a líderes comunitarios y actores de las Mesas Técnicas Agroclimáticas.`,
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
        name: "Programa Mundial de Alimentos",
        url: "https://es.wfp.org/",
        logo: "/assets/img/partners/PMA.svg",
        alt: "Programa Mundial de Alimentos logo",
      },
    ],
  },
  colors: {
    primary: "#2563eb",
    secondary: "#3b82f6",
    accent: "#dbeafe",
  },
};
