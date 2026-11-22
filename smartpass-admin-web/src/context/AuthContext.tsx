import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authService } from '../api/services';
import { notify } from '../lib/notify';
import { MESSAGES } from '../constants/messages';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mustSetPin: boolean;
  setMustSetPin: (val: boolean) => void;
  login: (token: string, user: User, mustSetPin?: boolean) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const ALLOWED_STAFF_ROLES = ['admin', 'librarian', 'canteen_staff', 'parking_staff'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialUser = (): User | null => {
  const token = localStorage.getItem('smartpass_admin_token');
  const saved = localStorage.getItem('smartpass_admin_user');
  if (token && saved) {
    try {
      return JSON.parse(saved) as User;
    } catch {
      return null;
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [loading, setLoading] = useState<boolean>(true);
  const [mustSetPin, setMustSetPin] = useState<boolean>(false);

  const logout = () => {
    localStorage.removeItem('smartpass_admin_token');
    localStorage.removeItem('smartpass_admin_user');
    setUser(null);
    setMustSetPin(false);
  };

  const login = (token: string, newUser: User, needsPin = false) => {
    if (newUser.role === 'student') {
      logout();
      notify.error(MESSAGES.AUTH_NOT_STAFF);
      return;
    }
    if (!ALLOWED_STAFF_ROLES.includes(newUser.role)) {
      logout();
      notify.error(MESSAGES.AUTH_FORBIDDEN);
      return;
    }
    localStorage.setItem('smartpass_admin_token', token);
    localStorage.setItem('smartpass_admin_user', JSON.stringify(newUser));
    setUser(newUser);
    setMustSetPin(Boolean(needsPin || !newUser.pinSetAt));
  };

  const refreshUser = async () => {
    try {
      const me = await authService.getMe();
      if (me.role === 'student') {
        logout();
        notify.error(MESSAGES.AUTH_NOT_STAFF);
        return;
      }
      if (!ALLOWED_STAFF_ROLES.includes(me.role)) {
        logout();
        notify.error(MESSAGES.AUTH_FORBIDDEN);
        return;
      }
      setUser(me);
      setMustSetPin(!me.pinSetAt);
      localStorage.setItem('smartpass_admin_user', JSON.stringify(me));
    } catch {
      // Handled in axios interceptor if 401
    }
  };

  useEffect(() => {
    const handleLogoutEvent = () => {
      logout();
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('smartpass_admin_token');
    if (token) {
      authService
        .getMe()
        .then((me) => {
          if (me.role === 'student') {
            logout();
            notify.error(MESSAGES.AUTH_NOT_STAFF);
          } else if (!ALLOWED_STAFF_ROLES.includes(me.role)) {
            logout();
            notify.error(MESSAGES.AUTH_FORBIDDEN);
          } else {
            setUser(me);
            setMustSetPin(!me.pinSetAt);
            localStorage.setItem('smartpass_admin_user', JSON.stringify(me));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      logout();
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, mustSetPin, setMustSetPin, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
