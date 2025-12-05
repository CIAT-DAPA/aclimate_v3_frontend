import { BranchConfig } from './base';

export const hondurasConfig: BranchConfig = {
  name: 'honduras',
  displayName: 'AClimate Honduras',
  aboutUs: {
    title: 'Sobre la herramienta',
    description: `AClimate Honduras es una plataforma web especializada en el análisis de datos climáticos históricos espaciales.
Proporciona acceso a información climática procesada de fuentes como Copernicus (AgEra5 v2) y CHIRPS v3, facilitando la toma de decisiones en el sector agropecuario y la planificación territorial.`,
    projectTitle: 'AgriLAC',
    projectDescription: `AClimate Honduras forma parte de la iniciativa AClimate que busca democratizar el acceso a información climática de calidad en América Latina y el Caribe. Desarrollado en colaboración con COPECO-CENAOS, procesa datos climáticos diarios de múltiples fuentes satelitales y los transforma en información útil para la toma de decisiones.

La plataforma automatiza el procesamiento de datos desde la descarga hasta la visualización, incluyendo resampling, validación, cálculos mensuales y climatologías. Esto permite a usuarios de diferentes sectores acceder fácilmente a datos históricos espaciales y cálculos de indicadores climáticos para Honduras.`,
    projectLink: 'https://www.aclimate.org/',
    partnersTitle: 'Socios',
    partners: [
      {
        name: 'Alliance Bioversity-CIAT',
        url: 'https://alliancebioversityciat.org/',
        logo: '/assets/img/partners/alliance.png',
        alt: 'Alliance Bioversity-CIAT logo'
      },
      {
        name: 'COPECO-CENAOS',
        url: 'http://cenaos.copeco.gob.hn/',
        logo: '/assets/img/partners/copeco_cenaos.jpg',
        alt: 'COPECO-CENAOS logo'
      }
    ]
  },
  colors: {
    primary: '#bc6c25',
    secondary: '#dda15e',
    accent: '#fefae0'
  }
};