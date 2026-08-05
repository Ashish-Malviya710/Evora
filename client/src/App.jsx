import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';

// Lazy-loaded pages — each page is code-split into its own chunk
const Home = lazy(() => import('./pages/Home'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const QRScanner = lazy(() => import('./pages/QRScanner'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
    </div>
);

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
                <Navbar />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/events/:id" element={<EventDetail />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={<UserDashboard />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/organizer" element={<OrganizerDashboard />} />
                            <Route path="/create-event" element={<CreateEvent />} />
                            <Route path="/edit-event/:id" element={<CreateEvent />} />
                            <Route path="/qr-scanner" element={<QRScanner />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/wishlist" element={<Wishlist />} />
                            <Route path="/payment-success" element={<PaymentSuccess />} />
                            <Route path="/payment-failed" element={<PaymentFailed />} />
                            <Route path="*" element={<h1 className="text-3xl font-bold text-center mt-20">404 - Page Not Found</h1>} />
                        </Routes>
                    </Suspense>
                </main>
                <AIAssistant />
            </div>
        </Router>
    );
}

export default App;
