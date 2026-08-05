import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';

export const AuthContext = createContext();

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('loginTime');
    }, []);

    const checkTokenExpiry = useCallback(() => {
        const loginTime = localStorage.getItem('loginTime');
        const token = localStorage.getItem('token');

        if (loginTime && token) {
            const elapsedTime = Date.now() - parseInt(loginTime, 10);
            if (elapsedTime >= TWENTY_FOUR_HOURS_MS) {
                console.warn('Session expired (24 hours reached). Logging out automatically.');
                logout();
                return false;
            }
            return true;
        }
        return false;
    }, [logout]);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const isValid = checkTokenExpiry();
            if (isValid) {
                setUser(JSON.parse(userInfo));
            }
        }
        setLoading(false);
    }, [checkTokenExpiry]);

    // Periodically check every minute if 24 hours have elapsed
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            checkTokenExpiry();
        }, 60000); // Check every 60 seconds

        return () => clearInterval(interval);
    }, [user, checkTokenExpiry]);

    const saveAuthData = (data) => {
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        localStorage.setItem('loginTime', Date.now().toString());
    };

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            saveAuthData(data);
            return data;
        } catch (error) {
            if (error.response?.data?.needsVerification) throw error.response.data;
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (name, email, password, role) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password, role });
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp });
            saveAuthData(data);
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'OTP verification failed';
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, verifyOTP, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
