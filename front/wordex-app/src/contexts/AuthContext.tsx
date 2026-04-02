"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, User, getToken, clearTokens } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        // Bypass Authentication: Provide a virtual 'Guest Artisan' identity
        setUser({
          id: "guest-001",
          email: "guest@aether.local",
          username: "Guest Artisan",
          avatar_url: null,
          provider: "guest",
          created_at: new Date().toISOString()
        });
        setLoading(false);
        return;
      }
      const data = await auth.me();
      setUser(data);
    } catch (err) {
      console.error("Auth refresh failed:", err);
      // Even on error, we keep as guest to prevent blank screen
      setUser({
        id: "guest-001",
        email: "guest@aether.local",
        username: "Guest Artisan",
        avatar_url: null,
        provider: "guest",
        created_at: new Date().toISOString()
      });
      clearTokens();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Redirect logic (Only for explicit auth pages when already logged in as a real user)
  useEffect(() => {
    if (!loading && user) {
      const isAuthPage = pathname?.startsWith("/auth");
      if (isAuthPage && user.provider !== "guest") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    const data = await auth.login(email, password);
    localStorage.setItem("wordex_access_token", data.access_token);
    localStorage.setItem("wordex_refresh_token", data.refresh_token);
    await refreshUser();
    router.push("/dashboard");
  };

  const register = async (email: string, username: string, password: string) => {
    await auth.register(email, username, password);
    await login(email, password);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
