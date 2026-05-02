import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const role   = localStorage.getItem('role');
    const name   = localStorage.getItem('name');
    const userId = localStorage.getItem('userId');
    if (token && role) setUser({ token, role, name, userId: Number(userId) });
    setLoading(false);
  }, []);

  const login = (data) => {
    // data = AuthResponse: { token, role, name, userId }
    localStorage.setItem('token',  data.token);
    localStorage.setItem('role',   data.role);
    localStorage.setItem('name',   data.name);
    localStorage.setItem('userId', String(data.userId));
    setUser(data);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
