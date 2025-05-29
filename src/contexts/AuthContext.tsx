
'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  points: number;
  register: (name: string, email: string) => Promise<void>;
  logout: () => void;
  addPoints: (amount: number) => void;
  checkDailyLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [points, setPoints] = useState<number>(0);
  const router = useRouter();

  const loadUserFromStorage = useCallback(() => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('healthLogUser');
      const storedPoints = localStorage.getItem('healthLogUserPoints');
      const lastLoginDate = localStorage.getItem('healthLogLastLogin');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedPoints) {
        setPoints(parseInt(storedPoints, 10));
      }
      
      // Conceptual daily login check
      const today = new Date().toDateString();
      if (storedUser && lastLoginDate !== today) {
        // User logged in on a new day
        const newPoints = (storedPoints ? parseInt(storedPoints, 10) : 0) + 5; // Add 5 points for daily login
        setPoints(newPoints);
        localStorage.setItem('healthLogUserPoints', newPoints.toString());
        localStorage.setItem('healthLogLastLogin', today);
      } else if (!lastLoginDate && storedUser) {
        // First login ever for this stored user
        localStorage.setItem('healthLogLastLogin', today);
      }


    } catch (error) {
      console.error("Failed to load user from storage:", error);
      // Clear corrupted storage
      localStorage.removeItem('healthLogUser');
      localStorage.removeItem('healthLogUserPoints');
      localStorage.removeItem('healthLogLastLogin');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const register = async (name: string, email: string) => {
    setIsLoading(true);
    const newUser: User = { id: Date.now().toString(), name, email, registeredAt: new Date().toISOString() };
    localStorage.setItem('healthLogUser', JSON.stringify(newUser));
    localStorage.setItem('healthLogUserPoints', '0'); // Initialize points
    localStorage.setItem('healthLogLastLogin', new Date().toDateString()); // Set last login
    setUser(newUser);
    setPoints(0);
    setIsLoading(false);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('healthLogUser');
    localStorage.removeItem('healthLogUserPoints');
    localStorage.removeItem('healthLogLastLogin'); // Also clear last login
    setUser(null);
    setPoints(0);
    router.push('/register');
  };

  const addPoints = (amount: number) => {
    if (user) { // Only add points if a user is logged in
      setPoints(prevPoints => {
        const newTotalPoints = prevPoints + amount;
        localStorage.setItem('healthLogUserPoints', newTotalPoints.toString());
        return newTotalPoints;
      });
    }
  };
  
  const checkDailyLogin = useCallback(() => {
    if (user && !isLoading) {
        const lastLogin = localStorage.getItem('healthLogLastLogin');
        const today = new Date().toDateString();
        if (lastLogin !== today) {
            addPoints(5); // Add 5 points for new day login
            localStorage.setItem('healthLogLastLogin', today);
            // Potentially show a toast: "Welcome back! +5 daily login points!"
        }
    }
  }, [user, isLoading, addPoints]); // addPoints added to dependency array


  return (
    <AuthContext.Provider value={{ user, isLoading, points, register, logout, addPoints, checkDailyLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
