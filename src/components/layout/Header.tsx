import { useState } from 'react';
import { Moon, Sun, Layers, ChevronDown, Check } from 'lucide-react';
import type { Tenant } from '../../types/config';

interface HeaderProps {
  tenants: Tenant[];
  currentTenant: string;
  onTenantChange: (tenantId: string) => void;
  isLight: boolean;
  onThemeToggle: () => void;
}

export function Header({ tenants, currentTenant, onTenantChange, isLight, onThemeToggle }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const currentName = tenants.find(t => t.id === currentTenant)?.name ?? currentTenant;

  return (
    <header style={{
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      gap: '16px',
    }}>
      {/* Logotype */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px',
          background: 'var(--amber-dim)',
          border: '1px solid var(--amber)',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Layers style={{ width: '14px', height: '14px', color: 'var(--amber)' }} />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            Mimir UI
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', lineHeight: 1, marginTop: '2px' }}>
            metrics explorer
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

        {/* Tenant selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '5px 10px',
              background: open ? 'var(--elevated)' : 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-2)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span className="status-dot" style={{ animationPlayState: tenants.length ? 'running' : 'paused' }} />
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{currentName || '—'}</span>
            <ChevronDown style={{
              width: '11px', height: '11px', color: 'var(--text-3)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
          </button>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              minWidth: '176px',
              background: 'var(--elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '3px',
              zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {tenants.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onTenantChange(t.id); setOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    background: t.id === currentTenant ? 'var(--amber-dim)' : 'transparent',
                    color: t.id === currentTenant ? 'var(--amber-bright)' : 'var(--text-2)',
                    fontSize: '12px',
                    fontWeight: t.id === currentTenant ? 500 : 400,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                >
                  {t.name}
                  {t.id === currentTenant && (
                    <Check style={{ width: '12px', height: '12px', color: 'var(--amber)' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          style={{
            width: '30px', height: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-3)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          {isLight
            ? <Moon style={{ width: '13px', height: '13px' }} />
            : <Sun  style={{ width: '13px', height: '13px' }} />
          }
        </button>
      </div>
    </header>
  );
}
