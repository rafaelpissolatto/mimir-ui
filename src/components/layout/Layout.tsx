import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { Tenant } from '../../types/config';
import { loadConfig } from '../../config/config';
import { checkMimirHealth, type ConnectionStatus } from '../../lib/mimir';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isLight, setIsLight] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const shouldBeLight = saved === 'light' || (!saved && prefersLight);

    setIsLight(shouldBeLight);
    document.documentElement.classList.toggle('light', shouldBeLight);

    loadConfig().then(config => {
      setTenants(config.tenants);
      setCurrentTenant(config.defaultTenantId);

      checkMimirHealth(config.mimirBaseUrl).then(setConnectionStatus);
    });
  }, []);

  const handleThemeToggle = () => {
    const next = !isLight;
    setIsLight(next);
    localStorage.setItem('theme', next ? 'light' : 'dark');
    document.documentElement.classList.toggle('light', next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <Header
        tenants={tenants}
        currentTenant={currentTenant}
        onTenantChange={setCurrentTenant}
        isLight={isLight}
        onThemeToggle={handleThemeToggle}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar connectionStatus={connectionStatus} />

        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
