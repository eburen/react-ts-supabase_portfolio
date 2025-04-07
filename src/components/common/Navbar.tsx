import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const { totalItems } = useCart();
    const { wishlistItems } = useWishlist();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path: string) => {
        return location.pathname === path ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700';
    };

    const isAdmin = user?.role === 'admin';

    return (
        <nav className={`fixed w-full z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-white/90 py-3'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo and desktop navigation */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">E-Store</span>
                        </Link>
                        <div className="hidden md:ml-10 md:flex md:space-x-8">
                            <Link
                                to="/"
                                className={`${isActive('/')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-150`}
                            >
                                Home
                            </Link>
                            <Link
                                to="/shop"
                                className={`${isActive('/shop')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-150`}
                            >
                                Shop
                            </Link>
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className={`${isActive('/admin')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-150`}
                                >
                                    Admin Dashboard
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Desktop right navigation */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                        {user && (
                            <Link
                                to="/wishlist"
                                className="relative inline-flex p-2 text-gray-500 hover:text-indigo-600 transition"
                                aria-label="Favorites"
                            >
                                <HeartIcon className="h-6 w-6" />
                                {wishlistItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                                        {wishlistItems.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        <Link
                            to="/cart"
                            className="relative inline-flex p-2 text-gray-500 hover:text-indigo-600 transition"
                            aria-label="Shopping cart"
                        >
                            <ShoppingCartIcon className="h-6 w-6" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                                    {totalItems}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/profile"
                                    className="group relative"
                                >
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white overflow-hidden">
                                        {user.full_name ? (
                                            <span className="text-sm font-medium">{`${user.full_name.split(' ')[0][0]}${user.full_name.split(' ')[1]?.[0] || ''}`}</span>
                                        ) : (
                                            <span className="text-sm font-medium">{user.email?.[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span className="sr-only">Your profile</span>
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        {user && (
                            <Link
                                to="/wishlist"
                                className="relative mr-2 p-2 text-gray-500 hover:text-indigo-600"
                                aria-label="Favorites"
                            >
                                <HeartIcon className="h-6 w-6" />
                                {wishlistItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                                        {wishlistItems.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        <Link
                            to="/cart"
                            className="relative mr-2 p-2 text-gray-500 hover:text-indigo-600"
                            aria-label="Shopping cart"
                        >
                            <ShoppingCartIcon className="h-6 w-6" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                                    {totalItems}
                                </span>
                            )}
                        </Link>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                            {mobileMenuOpen ? (
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200`}>
                <div className="pt-2 pb-4 space-y-1 px-4">
                    <Link
                        to="/"
                        className={`${location.pathname === '/' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    >
                        Home
                    </Link>
                    <Link
                        to="/shop"
                        className={`${location.pathname === '/shop' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    >
                        Shop
                    </Link>
                    {user && (
                        <Link
                            to="/wishlist"
                            className={`${location.pathname === '/wishlist' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                        >
                            Favorites
                        </Link>
                    )}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`${location.pathname.startsWith('/admin') ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                        >
                            Admin Dashboard
                        </Link>
                    )}
                </div>

                <div className="pt-4 pb-3 border-t border-gray-200 px-4">
                    {user ? (
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                                    <span className="text-sm font-medium">{user.email?.[0].toUpperCase()}</span>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">{user.full_name || user.email}</div>
                                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                                </div>
                            </div>
                            <div className="space-y-1 mt-3">
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                                >
                                    Your Profile
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 px-4 py-3">
                            <Link
                                to="/login"
                                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
} 