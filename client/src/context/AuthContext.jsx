import { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('fitnex_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const { data } = await api.post('/api/auth/google', { idToken });
          localStorage.setItem('fitnex_token', data.token);
          localStorage.setItem('fitnex_user', JSON.stringify(data.user));
          setUser(data.user);
        } catch (err) {
          console.error('Backend auth failed:', err.message);
          setUser(null);
        }
      } else {
        localStorage.removeItem('fitnex_token');
        localStorage.removeItem('fitnex_user');
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Login failed:', err.message);
      throw err;
    }
  };

  const logout = async () => {
    await logOut();
    localStorage.removeItem('fitnex_token');
    localStorage.removeItem('fitnex_user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('fitnex_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
