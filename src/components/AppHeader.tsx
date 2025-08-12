import { getTelegramUser } from '../telegram';

export default function AppHeader() {
  const user = getTelegramUser();
  return (
    <header className="nav">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user?.photo_url ? (
          <img src={user.photo_url} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        ) : (
          <div className="icon" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        )}
        <div>{user?.username || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Pump'}</div>
      </div>
    </header>
  );
} 