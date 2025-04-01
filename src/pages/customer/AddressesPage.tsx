import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ShippingAddress } from '../../types';
import { HomeIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import '../../styles/AddressForm.css';

const AddressesPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [addressActionLoading, setAddressActionLoading] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchAddresses = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('shipping_addresses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('is_default', { ascending: false })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setAddresses(data || []);
            } catch (error) {
                console.error('Error fetching addresses:', error);
                setError('Failed to load addresses');
            } finally {
                setLoading(false);
            }
        };

        fetchAddresses();
    }, [user, navigate]);

    const handleSetDefault = async (addressId: string) => {
        if (!user) return;

        setAddressActionLoading(prev => ({ ...prev, [addressId]: true }));
        setError(null);
        setSuccess(null);

        try {
            // First, set all addresses to non-default
            await supabase
                .from('shipping_addresses')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Then, set the selected address as default
            const { error } = await supabase
                .from('shipping_addresses')
                .update({ is_default: true })
                .eq('id', addressId)
                .eq('user_id', user.id);

            if (error) throw error;

            // Update the local state
            setAddresses(addresses.map(address => ({
                ...address,
                is_default: address.id === addressId
            })));

            setSuccess('Default address updated successfully');
        } catch (error) {
            console.error('Error setting default address:', error);
            setError('Failed to set default address');
        } finally {
            setAddressActionLoading(prev => ({ ...prev, [addressId]: false }));
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!user) return;

        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        setAddressActionLoading(prev => ({ ...prev, [addressId]: true }));
        setError(null);
        setSuccess(null);

        try {
            const { error } = await supabase
                .from('shipping_addresses')
                .delete()
                .eq('id', addressId)
                .eq('user_id', user.id);

            if (error) throw error;

            // Update the local state
            setAddresses(addresses.filter(address => address.id !== addressId));

            setSuccess('Address deleted successfully');
        } catch (error) {
            console.error('Error deleting address:', error);
            setError('Failed to delete address');
        } finally {
            setAddressActionLoading(prev => ({ ...prev, [addressId]: false }));
        }
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
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
                        <button
                            onClick={() => navigate('/account/addresses/new')}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Add New Address
                        </button>
                    </div>

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

                    {addresses.length === 0 ? (
                        <div className="text-center py-12">
                            <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new address.</p>
                            <div className="mt-6">
                                <button
                                    onClick={() => navigate('/account/addresses/new')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Add Address
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {addresses.map((address) => (
                                <div
                                    key={address.id}
                                    className={`relative rounded-lg border ${address.is_default ? 'border-blue-500' : 'border-gray-200'} bg-white p-5 shadow-sm`}
                                >
                                    {address.is_default && (
                                        <div className="absolute top-3 right-3">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                                                <CheckCircleIcon className="mr-1 h-3 w-3" /> Default
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-4 min-h-[120px]">
                                        <h3 className="text-lg font-medium text-gray-900">{address.name}</h3>
                                        <div className="mt-2 text-sm text-gray-500 space-y-1">
                                            <p>{address.street}</p>
                                            <p>
                                                {address.city}, {address.state} {address.zipcode}
                                            </p>
                                            <p>{address.country}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4 flex justify-between">
                                        <button
                                            onClick={() => navigate(`/account/addresses/edit/${address.id}`)}
                                            className="text-sm text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                        >
                                            <PencilIcon className="h-4 w-4 mr-1" /> Edit
                                        </button>

                                        <div className="flex space-x-4">
                                            {!address.is_default && (
                                                <button
                                                    onClick={() => handleSetDefault(address.id)}
                                                    disabled={addressActionLoading[address.id]}
                                                    className="text-sm text-indigo-600 hover:text-indigo-900 inline-flex items-center disabled:opacity-50"
                                                >
                                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                    {addressActionLoading[address.id] && addressActionLoading[address.id] === true
                                                        ? 'Setting...'
                                                        : 'Set Default'}
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDeleteAddress(address.id)}
                                                disabled={addressActionLoading[address.id]}
                                                className="text-sm text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-50"
                                            >
                                                <TrashIcon className="h-4 w-4 mr-1" />
                                                {addressActionLoading[address.id] && addressActionLoading[address.id] === true
                                                    ? 'Deleting...'
                                                    : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressesPage; 