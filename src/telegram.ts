export type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
} | null;

export function getTelegramUser(): TgUser {
  try {
    const w = window as any;
    const webApp = w?.Telegram?.WebApp;
    if (webApp?.ready) {
      try { webApp.ready(); } catch {}
    }
    const user = webApp?.initDataUnsafe?.user;
    return user || null;
  } catch {
    return null;
  }
} 