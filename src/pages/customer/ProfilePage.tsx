import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ShippingAddress } from '../../types';

const ProfilePage = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState(user?.full_name || '');
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Tabs state for the profile page
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', 'addresses'

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            setLoading(true);
            try {
                // Fetch shipping addresses
                const { data: addressData, error: addressError } = await supabase
                    .from('shipping_addresses')
                    .select('*')
                    .eq('user_id', user.id);

                if (addressError) throw addressError;
                setAddresses(addressData || []);

                // Fetch orders
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select(`
            *,
            order_items (*)
          `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (orderError) throw orderError;
                setOrders(orderData || []);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to load user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, navigate]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setUpdateLoading(true);

        try {
            const { error } = await supabase
                .from('users')
                .update({ full_name: fullName })
                .eq('id', user?.id);

            if (error) throw error;

            setSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile');
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`${activeTab === 'profile'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`${activeTab === 'orders'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                            >
                                Orders
                            </button>
                            <button
                                onClick={() => setActiveTab('addresses')}
                                className={`${activeTab === 'addresses'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                            >
                                Addresses
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">My Profile</h2>

                                {error && (
                                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                        <span className="block sm:inline">{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                                        <span className="block sm:inline">{success}</span>
                                    </div>
                                )}

                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email address
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">
                                            Full name
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="full-name"
                                                name="full-name"
                                                type="text"
                                                autoComplete="name"
                                                required
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <button
                                            type="submit"
                                            disabled={updateLoading}
                                            className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${updateLoading ? 'opacity-75 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            {updateLoading ? 'Updating...' : 'Update Profile'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="text-sm font-medium text-red-600 hover:text-red-500"
                                        >
                                            Log out
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">My Orders</h2>

                                {orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">You haven't placed any orders yet.</p>
                                        <button
                                            onClick={() => navigate('/shop')}
                                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Browse Products
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {orders.map((order) => (
                                            <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            Order #{order.id.slice(0, 8)}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            Placed on{' '}
                                                            {new Date(order.created_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'delivered'
                                                                ? 'bg-green-100 text-green-800'
                                                                : order.status === 'shipped'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : order.status === 'processing'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : order.status === 'cancelled'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                }`}
                                                        >
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-200 pt-4">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                        Items ({order.order_items.length})
                                                    </h4>
                                                    <ul className="divide-y divide-gray-200">
                                                        {order.order_items.map((item: any) => (
                                                            <li key={item.id} className="py-3 flex justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {item.product_name}
                                                                        {item.variation_name && ` (${item.variation_name})`}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    ${(item.quantity * item.price).toFixed(2)}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="border-t border-gray-200 pt-4 mt-4">
                                                    <div className="flex justify-between text-sm">
                                                        <p className="font-medium text-gray-900">Total</p>
                                                        <p className="font-medium text-gray-900">${order.total.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Addresses Tab */}
                        {activeTab === 'addresses' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">My Addresses</h2>
                                    <button
                                        onClick={() => navigate('/account/addresses/new')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Add New Address
                                    </button>
                                </div>

                                {addresses.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">You haven't added any addresses yet.</p>
                                        <button
                                            onClick={() => navigate('/account/addresses/new')}
                                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Add Address
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        {addresses.map((address) => (
                                            <div key={address.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                {address.is_default && (
                                                    <div className="mb-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            Default
                                                        </span>
                                                    </div>
                                                )}
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">{address.name}</h3>
                                                <div className="text-sm text-gray-500 space-y-1">
                                                    <p>{address.street}</p>
                                                    <p>
                                                        {address.city}, {address.state} {address.zipcode}
                                                    </p>
                                                    <p>{address.country}</p>
                                                </div>
                                                <div className="mt-4 flex space-x-4">
                                                    <button
                                                        onClick={() => navigate(`/account/addresses/edit/${address.id}`)}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                                    >
                                                        Edit
                                                    </button>
                                                    {!address.is_default && (
                                                        <button
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                                        >
                                                            Set as Default
                                                        </button>
                                                    )}
                                                    <button
                                                        className="text-sm font-medium text-red-600 hover:text-red-500"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage; 