import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserIcon, ShoppingBagIcon, HeartIcon, HomeIcon } from '@heroicons/react/24/outline';

const SidebarAccount = () => {
    const navLinks = [
        { name: 'Profile', to: '/profile', icon: UserIcon },
        { name: 'Orders', to: '/account/orders', icon: ShoppingBagIcon },
        { name: 'Wishlist', to: '/wishlist', icon: HeartIcon },
        { name: 'Addresses', to: '/account/addresses', icon: HomeIcon },
    ];

    return (
        <nav className="space-y-1">
            {navLinks.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) =>
                        `flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <item.icon
                                className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive ? 'text-indigo-600' : 'text-gray-400'
                                    }`}
                                aria-hidden="true"
                            />
                            <span>{item.name}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
};

export default SidebarAccount; 