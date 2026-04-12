import { NavLink } from 'react-router-dom';
import { Search, BookOpen, Bell } from 'lucide-react';
import type { ConnectionStatus } from '../../lib/mimir';

const navigation = [
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'Rules',   href: '/rules',   icon: BookOpen },
  { name: 'Alerts',  href: '/alerts',  icon: Bell },
];

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string; pulse: boolean }> = {
  checking:    { color: 'var(--amber)',  label: 'Checking…',   pulse: true  },
  connected:   { color: 'var(--green)',  label: 'Connected',   pulse: true  },
  unreachable: { color: 'var(--red)',    label: 'Unreachable', pulse: false },
};

interface SidebarProps {
  connectionStatus: ConnectionStatus;
}

export function Sidebar({ connectionStatus }: SidebarProps) {
  const { color, label, pulse } = STATUS_CONFIG[connectionStatus];

  return (
    <aside style={{
      width: '196px',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navigation.map(({ name, href, icon: Icon }) => (
          <NavLink
            key={name}
            to={href}
            className={({ isActive }) => `forge-nav-link${isActive ? ' active' : ''}`}
          >
            <Icon />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Connection status */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: pulse ? `0 0 5px ${color}` : 'none',
          animation: pulse ? 'pulse-dot 2.5s ease-in-out infinite' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }} />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', transition: 'color 0.3s' }}>
            {label}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>Mimir API</div>
        </div>
      </div>
    </aside>
  );
}
