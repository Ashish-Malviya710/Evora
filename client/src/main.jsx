import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <SocketProvider>
                    <App />
                    <Toaster position="top-right" toastOptions={{
                        style: { borderRadius: '12px', background: '#1f2937', color: '#fff', fontSize: '14px' }
                    }} />
                </SocketProvider>
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>,
)
