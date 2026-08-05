import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 
            (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');

        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {});
        newSocket.on('disconnect', () => {});

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
