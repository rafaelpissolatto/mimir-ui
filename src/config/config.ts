import type { Config } from '../types/config';

export const defaultConfig: Config = {
  mimirBaseUrl: '',
  tenantHeaderName: 'X-Scope-OrgID',
  defaultTenantId: 'demo',
  tenants: [
    { id: 'demo', name: 'Demo' },
    { id: 'prod', name: 'Production' },
    { id: 'staging', name: 'Staging' },
  ],
  auth: { type: 'none' },
};

export const loadConfig = async (): Promise<Config> => {
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      const config = await response.json();
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.warn('Failed to load config.json, using defaults:', error);
  }
  return defaultConfig;
};
