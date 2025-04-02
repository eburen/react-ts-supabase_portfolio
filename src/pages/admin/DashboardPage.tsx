import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    ShoppingBagIcon,
    TagIcon,
    UserIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    totalRevenue: number;
    recentOrders: any[];
}

const DashboardPage = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        recentOrders: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Get total orders
                const { count: totalOrders } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true });

                // Get total products
                const { count: totalProducts } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true });

                // Get total customers
                const { count: totalCustomers } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'customer');

                // Get total revenue
                const { data: revenueData } = await supabase
                    .from('orders')
                    .select('total')
                    .eq('status', 'delivered');

                const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;

                // Get recent orders
                const { data: recentOrders } = await supabase
                    .from('orders')
                    .select('*, users(full_name, email)')
                    .order('created_at', { ascending: false })
                    .limit(5);

                setStats({
                    totalOrders: totalOrders || 0,
                    totalProducts: totalProducts || 0,
                    totalCustomers: totalCustomers || 0,
                    totalRevenue,
                    recentOrders: recentOrders || [],
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        {
            name: 'Total Orders',
            value: stats.totalOrders,
            icon: TagIcon,
            color: 'bg-indigo-100',
            iconColor: 'text-indigo-500',
            link: '/admin/orders'
        },
        {
            name: 'Total Products',
            value: stats.totalProducts,
            icon: ShoppingBagIcon,
            color: 'bg-emerald-100',
            iconColor: 'text-emerald-500',
            link: '/admin/products'
        },
        {
            name: 'Total Customers',
            value: stats.totalCustomers,
            icon: UserIcon,
            color: 'bg-blue-100',
            iconColor: 'text-blue-500',
            link: '/admin/customers'
        },
        {
            name: 'Total Revenue',
            value: `$${stats.totalRevenue.toFixed(2)}`,
            icon: CurrencyDollarIcon,
            color: 'bg-amber-100',
            iconColor: 'text-amber-500',
            link: '/admin/analytics'
        },
    ];

    return (
        <AdminLayout>
            <div className="py-6">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

                {loading ? (
                    <div className="mt-6 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats cards */}
                        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {statCards.map((card) => (
                                <Link
                                    key={card.name}
                                    to={card.link}
                                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className={`flex-shrink-0 p-3 rounded-md ${card.color}`}>
                                                <card.icon className={`h-6 w-6 ${card.iconColor}`} aria-hidden="true" />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                                                    <dd>
                                                        <div className="text-lg font-semibold text-gray-900">{card.value}</div>
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Recent orders */}
                        <div className="mt-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
                                <Link to="/admin/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                    View all
                                </Link>
                            </div>

                            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                                {stats.recentOrders.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {stats.recentOrders.map((order) => (
                                            <li key={order.id}>
                                                <Link to={`/admin/orders/${order.id}`} className="block hover:bg-gray-50">
                                                    <div className="px-4 py-4 sm:px-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <p className="text-sm font-medium text-indigo-600 truncate">Order #{order.id.substring(0, 8)}...</p>
                                                                <div className="ml-2 flex-shrink-0 flex">
                                                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                                                    'bg-gray-100 text-gray-800'}`}>
                                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-900 font-medium">${parseFloat(order.total).toFixed(2)}</div>
                                                        </div>
                                                        <div className="mt-2 sm:flex sm:justify-between">
                                                            <div className="sm:flex">
                                                                <p className="flex items-center text-sm text-gray-500">
                                                                    {order.users?.full_name || 'Unknown user'}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                                <p>
                                                                    {new Date(order.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-10 text-center">
                                        <p className="text-gray-500">No orders found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default DashboardPage; 