import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth';

export function DemoAutoLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const hasToken = useAuthStore((s) => !!s.token);

  useEffect(() => {
    const MOCK_ENABLED = false;
    if (MOCK_ENABLED && !hasToken) {
      setAuth(
        { id: 1, email: 'demo@tesis.com', nombre: 'Usuario Demo', roles: ['USER'] },
        'demo-token-mock'
      );
    }
  }, [hasToken, setAuth]);

  return null;
}

export default DemoAutoLogin;
