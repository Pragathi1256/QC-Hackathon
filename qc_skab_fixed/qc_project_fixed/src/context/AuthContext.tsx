import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  username: string;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const USERS: Record<string, string> = {
  admin: "quantum123",
  demo: "demo",
  engineer: "sensor@2024",
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const login = (username: string, password: string) => {
    const trimmed = username.trim().toLowerCase();
    if (USERS[trimmed] && USERS[trimmed] === password) {
      setIsLoggedIn(true);
      setUsername(trimmed);
      return { success: true };
    }
    return { success: false, error: "Invalid username or password" };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername("");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
