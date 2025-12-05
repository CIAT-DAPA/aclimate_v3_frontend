// Configuración base que comparten todas las ramas
export interface BranchConfig {
  name: string;
  displayName: string;
  aboutUs: {
    title: string;
    description: string;
    projectTitle: string;
    projectDescription: string;
    projectLink?: string;
    partnersTitle: string;
    partners: Array<{
      name: string;
      url: string;
      logo: string;
      alt: string;
    }>;
  };
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const getDefaultConfig = (): BranchConfig => ({
  name: 'default',
  displayName: 'AClimate',
  aboutUs: {
    title: 'Sobre la herramienta',
    description: `AClimate es una herramienta diseñada para apoyar la toma de decisiones en el sector agropecuario.
Proporciona la capacidad de analizar datos climáticos y generar reportes detallados para diferentes regiones.`,
    projectTitle: 'Proyecto',
    projectDescription: 'Descripción del proyecto.',
    partnersTitle: 'Socios',
    partners: [
      {
        name: 'Alliance Bioversity-CIAT',
        url: 'https://alliancebioversityciat.org/',
        logo: 'https://www.aclimate.org/images/alliance.png',
        alt: 'Alliance Bioversity-CIAT logo'
      }
    ]
  }
});