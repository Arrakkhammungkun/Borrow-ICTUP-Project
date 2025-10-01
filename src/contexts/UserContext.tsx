// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  displayName: string;
  jobTitle: string;
  mobilePhone: string;
  officeLocation: string;
  prefix: string;
  title: string;
  up_id: string;
  email: string;
  first_name: string;
  last_name: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: false,
  setUser: () => {},
  setLoading: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูล user จาก localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserState(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // เมื่อ user เปลี่ยน ให้บันทึกลง localStorage
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, setUser, setLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
