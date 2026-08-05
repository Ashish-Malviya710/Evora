import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="mt-auto py-10 bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700 text-center transition-colors">
            <div className="container mx-auto px-4 flex flex-col items-center gap-3">
                <Link to="/" className="flex items-center gap-3 group">
                    <img src="/logo.png" alt="Evora Logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain filter drop-shadow-md transition-transform group-hover:scale-105" />
                    <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Evora</span>
                </Link>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                    The ultimate AI-powered event booking & management ecosystem for attendees, organizers, and administrators.
                </p>
                <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-gray-600 dark:text-gray-300 my-2">
                    <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition">Events</Link>
                    <Link to="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition">Login</Link>
                    <Link to="/register" className="hover:text-primary-600 dark:hover:text-primary-400 transition">Register</Link>
                    <Link to="/wishlist" className="hover:text-primary-600 dark:hover:text-primary-400 transition">Wishlist</Link>
                </div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Developed & Managed by Ashish Kumar
                </p>
                <div className="text-xs text-gray-400 font-medium tracking-wider">
                    &copy; {new Date().getFullYear()} Evora Platform. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
