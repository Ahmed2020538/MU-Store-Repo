import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  loyaltyPoints: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("mu_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mu_token"));

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("mu_token", newToken);
    localStorage.setItem("mu_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("mu_token");
    localStorage.removeItem("mu_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === "admin", isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
