import { BranchConfig } from './base';

export const satConfig: BranchConfig = {
  name: 'sat',
  displayName: 'AClimate SAT Amazonia',
  aboutUs: {
    title: 'Sobre la herramienta',
    description: `AClimate SAT es una plataforma especializada en el análisis de datos climáticos espaciales para la región amazónica.
Integra información satelital de múltiples fuentes para proporcionar datos históricos y análisis climatológicos que apoyan la investigación y gestión ambiental en la Amazonía.`,
    projectTitle: 'Tecnología Satelital',
    projectDescription: `AClimate SAT se enfoca en el procesamiento y análisis de datos climáticos satelitales para la región amazónica. Utiliza tecnologías avanzadas de procesamiento de datos espaciales para transformar información cruda de sensores remotos en productos climáticos de alta calidad.

La plataforma automatiza flujos de trabajo complejos que incluyen descarga, validación, procesamiento y visualización de datos climáticos, facilitando el acceso a información crítica para la investigación climática, conservación y manejo sostenible de ecosistemas amazónicos.`,
    partnersTitle: 'Colaboradores',
    projectLink: 'https://www.aclimate.org/',
    partners: [
      {
        name: 'Alliance Bioversity-CIAT',
        url: 'https://alliancebioversityciat.org/',
        logo: '/assets/img/partners/alliance.png',
        alt: 'Alliance Bioversity-CIAT logo'
      },
    ]
  },
  colors: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#dbeafe'
  }
};