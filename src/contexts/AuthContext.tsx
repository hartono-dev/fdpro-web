import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  fdCode?: string;
  aajiCode?: string;
  aajiExpiry?: string;
  avatarUrl?: string;
  createdAt?: string;
  mustChangePwd?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);

    // Login response sudah mencakup role, fdCode (nullable), mustChangePwd, dll.
    let userWithCode = { ...data.user };

    // Coba sinkronkan fdCode lewat endpoint ensure-fdcode (untuk agen/BP
    // yang belum punya kode). Untuk admin/super_admin endpoint mengembalikan
    // fdCode: null dan TIDAK memblokir login (HTTP 200). Jika gagal,
    // abaikan — kegagalan pengambilan fdCode tidak boleh membatalkan login.
    try {
      const codeResponse = await api.post('/api/users/ensure-fdcode', {});
      if (codeResponse?.fdCode) {
        userWithCode = { ...userWithCode, fdCode: codeResponse.fdCode };
      }
    } catch {
      // Abaikan: error ensure-fdcode tidak boleh menghentikan alur login.
    }

    localStorage.setItem('user', JSON.stringify(userWithCode));
    setToken(data.token);
    setUser(userWithCode);
    return userWithCode as User;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ user, token, isAuthenticated: !!token, login, logout, updateUser }),
    [user, token, login, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};


// eslint-disable-next-line react/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
