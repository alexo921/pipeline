export type CompanyConfig = {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  navyColor: string;
  contactEmail: string;
  logoType: 'pipeline' | 'text';
  logoText?: string;
  facilityId: string;
  isPoweredByPipeline?: boolean;
};

export const companies: Record<string, CompanyConfig> = {
  default: {
    id: 'default',
    name: 'Pipeline Workforce',
    shortName: 'Pipeline',
    tagline: 'The Retention Platform For Skilled Nursing',
    description:
      'Pipeline is built for skilled nursing facilities — helping reduce turnover, prevent no-shows, and retain the staff who keep care consistent.',
    primaryColor: '#2466D0',
    accentColor: '#2CB3BF',
    navyColor: '#01253F',
    contactEmail: 'info@pipelineworkforce.com',
    logoType: 'pipeline',
    facilityId: 'facility-123',
  },
  'careone-holyoke': {
    id: 'careone-holyoke',
    name: 'CareOne At Holyoke',
    shortName: 'CareOne',
    tagline: 'Workforce Retention Intelligence for CareOne At Holyoke',
    description:
      'Powered by Pipeline — helping CareOne At Holyoke reduce turnover, prevent no-shows, and retain the nursing staff who keep care consistent.',
    primaryColor: '#1a5c8c',
    accentColor: '#2CB3BF',
    navyColor: '#01253F',
    contactEmail: 'info@pipelineworkforce.com',
    logoType: 'text',
    logoText: 'CareOne At Holyoke',
    facilityId: 'careone-holyoke-facility',
    isPoweredByPipeline: true,
  },
};

export function getCompanyConfig(id?: string | null): CompanyConfig {
  if (!id || id === 'default') return companies.default;
  return companies[id] ?? companies.default;
}
