import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBagIcon, HomeIcon } from '@heroicons/react/24/outline';

const SidebarAccount: React.FC = () => {
    const location = useLocation();

    return (
        <div className="space-y-1">
            <Link
                to="/account/orders"
                className={`${location.pathname.includes('/account/orders') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
            >
                <ShoppingBagIcon
                    className={`${location.pathname.includes('/account/orders') ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                />
                Orders
            </Link>

            <Link
                to="/account/addresses"
                className={`${location.pathname.includes('/account/addresses') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
            >
                <HomeIcon
                    className={`${location.pathname.includes('/account/addresses') ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                />
                Addresses
            </Link>
        </div>
    );
};

export default SidebarAccount; 