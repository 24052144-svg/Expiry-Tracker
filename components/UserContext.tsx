"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Loader2Icon } from "lucide-react";

export interface UserData {
  _id: string;
  name: string;
  email: string;
  reminderDays?: number;
  notificationChannel?: "email" | "push";
  emailReminder?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  refreshUser: (showLoading?: boolean) => Promise<void>;
  isUserLoading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("UserProvider is missing");
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const refreshUser = async (showLoading = true) => {
    if (showLoading) setIsUserLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setIsUserLoading(false);
        return;
      }

      // Fetch actual user data from backend
      const response = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUser(result.data);
          // Sync with localStorage
          localStorage.setItem("user", JSON.stringify(result.data));
        }
      } else {
        // Token invalid, clear storage
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } finally {
      setIsUserLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  if (isUserLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, isUserLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
};