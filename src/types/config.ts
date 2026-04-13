export interface Tenant {
  id: string;
  name: string;
}

export interface Auth {
  type: 'none' | 'bearer';
  token?: string;
}

export interface Config {
  mimirBaseUrl: string;
  tenantHeaderName: string;
  defaultTenantId: string;
  tenants: Tenant[];
  auth: Auth;
}
