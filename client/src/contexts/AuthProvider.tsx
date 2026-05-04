import { useEffect, useState } from "react";
import { AuthContext, type User } from "./AuthContext";

let storedToken: string | null = null;
if (typeof window !== 'undefined') { // Check if we're running in the browser.
  storedToken = localStorage.getItem('authToken')
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(storedToken));

  // Initialize auth state from localStorage
  useEffect(() => {
    if (storedToken) {
        const verifyToken = async (authToken: string) => {
            try {
                const res = await fetch('/api/auth/verify', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser({ username: data.username });
                    setToken(authToken);
                } else {
                    // Token is invalid, clear it
                    localStorage.removeItem('authToken');
                    setToken(null);
                    setUser(null);
                }
            } catch (error) {
                console.error('Token verification failed:', error);
                localStorage.removeItem('authToken');
                setToken(null);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        // Verify token is still valid
        verifyToken(storedToken);
    }
  }, []);

  const login = async (username: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      const newToken = data.token;

      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser({ username });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}