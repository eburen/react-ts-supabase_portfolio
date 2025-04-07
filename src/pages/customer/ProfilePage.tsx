import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ShippingAddress, Gender, Review, Order, OrderItem } from '../../types';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
    const { user, signOut, updateUserProfile } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState(user?.full_name || '');
    const [birthday, setBirthday] = useState(user?.birthday || '');
    const [gender, setGender] = useState<Gender | ''>(user?.gender || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [addressActionLoading, setAddressActionLoading] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // State for order details and reviews
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
    const [reviewProduct, setReviewProduct] = useState<{ productId: string, productName: string, orderId: string } | null>(null);
    const [rating, setRating] = useState<number>(5);
    const [reviewText, setReviewText] = useState<string>('');
    const [reviewLoading, setReviewLoading] = useState<boolean>(false);
    const [userReviews, setUserReviews] = useState<Review[]>([]);

    // Tabs state for the profile page
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', 'addresses'

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Update local state when user changes
        setFullName(user.full_name || '');
        setBirthday(user.birthday || '');
        setGender(user.gender || '');
        setPhoneNumber(user.phone_number || '');

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

                // Fetch user reviews
                const { data: reviewData, error: reviewError } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('user_id', user.id);

                if (reviewError) throw reviewError;
                setUserReviews(reviewData || []);
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
            const userData = {
                full_name: fullName.trim() || undefined,
                birthday: birthday || undefined,
                gender: gender || undefined,
                phone_number: phoneNumber.trim() || undefined
            };

            console.log('Updating profile with data:', userData);

            const { error: updateError, user: updatedUser } = await updateUserProfile(userData);

            if (updateError) {
                console.error('Profile update error:', updateError);
                throw updateError;
            }

            console.log('Profile updated successfully:', updatedUser);
            setSuccess('Profile updated successfully');

            // Update local state with the returned user data
            if (updatedUser) {
                setFullName(updatedUser.full_name || '');
                setBirthday(updatedUser.birthday || '');
                setGender(updatedUser.gender || '');
                setPhoneNumber(updatedUser.phone_number || '');
            }
        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
            setError(errorMessage);
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleSetDefaultAddress = async (addressId: string) => {
        if (!user) return;

        setAddressActionLoading(prev => ({ ...prev, [addressId]: true }));

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

    // Function to check if a product has been reviewed
    const hasBeenReviewed = (productId: string) => {
        return userReviews.some(review => review.product_id === productId);
    };

    // Function to handle review submission
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewProduct || !user) return;

        setReviewLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    product_id: reviewProduct.productId,
                    user_id: user.id,
                    username: user.full_name || 'Anonymous',
                    rating,
                    text: reviewText,
                    created_at: new Date().toISOString()
                })
                .select();

            if (error) throw error;

            // Update local state
            const newReview: Review = {
                id: data?.[0]?.id || 'temp-id',
                product_id: reviewProduct.productId,
                user_id: user.id,
                username: user.full_name || 'Anonymous',
                rating,
                text: reviewText,
                created_at: new Date().toISOString()
            };

            setUserReviews([...userReviews, newReview]);

            setSuccess('Review submitted successfully');
            setReviewProduct(null);
            setRating(5);
            setReviewText('');
        } catch (error: unknown) {
            console.error('Error submitting review:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
            setError(errorMessage);
        } finally {
            setReviewLoading(false);
        }
    };

    // Function to get payment status badge
    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                );
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

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">My Profile</h2>

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

                                    <div>
                                        <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700">
                                            Phone number
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="phone-number"
                                                name="phone-number"
                                                type="tel"
                                                autoComplete="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
                                            Birthday
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="birthday"
                                                name="birthday"
                                                type="date"
                                                value={birthday}
                                                onChange={(e) => setBirthday(e.target.value)}
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                            Gender
                                        </label>
                                        <div className="mt-1">
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value as Gender)}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer_not_to_say">Prefer not to say</option>
                                            </select>
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
                                        {/* Product Review Modal */}
                                        {reviewProduct && (
                                            <div className="fixed inset-0 overflow-y-auto z-50">
                                                <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                                        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                                                    </div>
                                                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                                                    <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                                        <div>
                                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                                Review {reviewProduct.productName}
                                                            </h3>
                                                            <form onSubmit={handleSubmitReview} className="mt-4">
                                                                <div className="mb-4">
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Rating
                                                                    </label>
                                                                    <div className="flex items-center">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <button
                                                                                key={star}
                                                                                type="button"
                                                                                onClick={() => setRating(star)}
                                                                                className="focus:outline-none"
                                                                            >
                                                                                {star <= rating ? (
                                                                                    <StarIcon className="h-8 w-8 text-yellow-400" />
                                                                                ) : (
                                                                                    <StarOutlineIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                                                                                )}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="mb-4">
                                                                    <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Your Review
                                                                    </label>
                                                                    <textarea
                                                                        id="review-text"
                                                                        rows={4}
                                                                        value={reviewText}
                                                                        onChange={(e) => setReviewText(e.target.value)}
                                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                        placeholder="Share your experience with this product..."
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end gap-3 mt-5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setReviewProduct(null)}
                                                                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="submit"
                                                                        disabled={reviewLoading}
                                                                        className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${reviewLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        {reviewLoading ? 'Submitting...' : 'Submit Review'}
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

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
                                                    <div className="flex items-center space-x-3">
                                                        {order.payment_status && (
                                                            <div>{getPaymentStatusBadge(order.payment_status)}</div>
                                                        )}
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

                                                <div className="flex space-x-3 mb-4">
                                                    <button
                                                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                                    >
                                                        {selectedOrder === order.id ? 'Hide Details' : 'View Summary'}
                                                    </button>

                                                    <Link
                                                        to={`/order/${order.id}`}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                                    >
                                                        View Order Details
                                                    </Link>
                                                </div>

                                                {selectedOrder === order.id && (
                                                    <div className="mt-4 space-y-4">
                                                        {/* Shipping Address */}
                                                        {order.shipping_address && (
                                                            <div className="bg-white p-4 rounded-md border border-gray-200">
                                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                                                                <div className="text-sm text-gray-500">
                                                                    <p>{order.shipping_address.name}</p>
                                                                    <p>{order.shipping_address.street}</p>
                                                                    <p>
                                                                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipcode}
                                                                    </p>
                                                                    <p>{order.shipping_address.country}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Order Details */}
                                                        <div className="bg-white p-4 rounded-md border border-gray-200">
                                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details</h4>
                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                                                                {order.payment_method && (
                                                                    <div>
                                                                        <span className="font-medium">Payment Method:</span> {order.payment_method.replace('_', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                                    </div>
                                                                )}
                                                                {order.delivery_date && (
                                                                    <div>
                                                                        <span className="font-medium">Delivery Date:</span> {new Date(order.delivery_date).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                                {order.delivery_time && (
                                                                    <div>
                                                                        <span className="font-medium">Delivery Time:</span> {order.delivery_time}
                                                                    </div>
                                                                )}
                                                                {order.express_shipping && (
                                                                    <div>
                                                                        <span className="font-medium">Express Shipping:</span> Yes
                                                                    </div>
                                                                )}
                                                                {order.gift_wrapping && (
                                                                    <div>
                                                                        <span className="font-medium">Gift Wrapping:</span> Yes
                                                                    </div>
                                                                )}
                                                                {order.gift_note && (
                                                                    <div className="col-span-2">
                                                                        <span className="font-medium">Gift Note:</span> {order.gift_note}
                                                                    </div>
                                                                )}
                                                                {order.special_instructions && (
                                                                    <div className="col-span-2">
                                                                        <span className="font-medium">Special Instructions:</span> {order.special_instructions}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="border-t border-gray-200 pt-4 mt-4">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                        Items ({order.order_items.length})
                                                    </h4>
                                                    <ul className="divide-y divide-gray-200">
                                                        {order.order_items.map((item: OrderItem) => (
                                                            <li key={item.id} className="py-3 flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {item.product_name}
                                                                        {item.variation_name && ` (${item.variation_name})`}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                                <div className="flex space-x-3 items-center">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        ${(item.quantity * item.price).toFixed(2)}
                                                                    </p>

                                                                    {/* Show review button only for delivered orders and products not yet reviewed */}
                                                                    {order.status === 'delivered' && !hasBeenReviewed(item.product_id) && (
                                                                        <button
                                                                            onClick={() => setReviewProduct({
                                                                                productId: item.product_id,
                                                                                productName: item.product_name,
                                                                                orderId: order.id
                                                                            })}
                                                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-2 py-1 rounded"
                                                                        >
                                                                            Write Review
                                                                        </button>
                                                                    )}

                                                                    {/* Show "Reviewed" badge if already reviewed */}
                                                                    {hasBeenReviewed(item.product_id) && (
                                                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                                                            Reviewed
                                                                        </span>
                                                                    )}

                                                                    {/* Link to product page */}
                                                                    <Link
                                                                        to={`/shop/product/${item.product_id}`}
                                                                        className="text-xs text-blue-600 hover:text-blue-500 bg-blue-50 px-2 py-1 rounded"
                                                                    >
                                                                        View Product
                                                                    </Link>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="border-t border-gray-200 pt-4 mt-4">
                                                    <div className="flex justify-between text-sm">
                                                        <p className="font-medium text-gray-900">Subtotal</p>
                                                        <p className="font-medium text-gray-900">
                                                            ${(order.total - (order.shipping_fee ?? 0) - (order.gift_wrapping_fee ?? 0)).toFixed(2)}
                                                        </p>
                                                    </div>

                                                    {order.shipping_fee !== undefined && order.shipping_fee > 0 && (
                                                        <div className="flex justify-between text-sm mt-1">
                                                            <p className="text-gray-500">Shipping {order.express_shipping ? '(Express)' : ''}</p>
                                                            <p className="text-gray-500">${order.shipping_fee.toFixed(2)}</p>
                                                        </div>
                                                    )}

                                                    {order.gift_wrapping_fee !== undefined && order.gift_wrapping_fee > 0 && (
                                                        <div className="flex justify-between text-sm mt-1">
                                                            <p className="text-gray-500">Gift Wrapping</p>
                                                            <p className="text-gray-500">${order.gift_wrapping_fee.toFixed(2)}</p>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between text-sm font-medium text-gray-900 mt-2 pt-2 border-t border-gray-200">
                                                        <p>Total</p>
                                                        <p>${order.total.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                {order.status === 'delivered' && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Track shipment</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Your order has been delivered. Thank you for shopping with us!
                                                        </p>
                                                    </div>
                                                )}

                                                {order.status === 'shipped' && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Track shipment</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Your order is on its way! You will receive it soon.
                                                        </p>
                                                        <button className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                            Track Package
                                                        </button>
                                                    </div>
                                                )}
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
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                                    >
                                                        Edit
                                                    </button>
                                                    {!address.is_default && (
                                                        <button
                                                            onClick={() => handleSetDefaultAddress(address.id)}
                                                            disabled={addressActionLoading[address.id]}
                                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                                                        >
                                                            {addressActionLoading[address.id] ? 'Setting...' : 'Set as Default'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteAddress(address.id)}
                                                        disabled={addressActionLoading[address.id]}
                                                        className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                                                    >
                                                        {addressActionLoading[address.id] ? 'Deleting...' : 'Delete'}
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