import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'RESOURCE';
}

interface AuthContextType {
    user: User | null;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await auth.getMe();
                setUser(res.data);
            } catch (error) {
                console.log("Not authenticated");
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (credentials: any) => {
        const res = await auth.login(credentials);
        setUser(res.data);
    };

    const register = async (data: any) => {
        const res = await auth.register(data);
        setUser(res.data);
    }

    const logout = async () => {
        try {
            await auth.logout();
        } catch (error) {
            console.error(error);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
