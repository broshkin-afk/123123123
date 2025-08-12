import { Link, useLocation } from 'react-router-dom';
import { FileIcon, SparklesIcon, GearIcon, ChartIcon } from './icons';

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <div className="bottom-nav">
      <div className="wrap">
        <Link to="/" className={pathname === '/' ? 'active' : ''}><FileIcon />Templates</Link>
        <Link to="/register" className={pathname === '/register' ? 'active' : ''}><SparklesIcon />Register</Link>
        <Link to="/settings" className={pathname === '/settings' ? 'active' : ''}><GearIcon />Settings</Link>
        <Link to="/stats" className={pathname === '/stats' ? 'active' : ''}><ChartIcon />Stats</Link>
      </div>
    </div>
  );
} 