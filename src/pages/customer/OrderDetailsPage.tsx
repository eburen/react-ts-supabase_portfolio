import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    CheckCircleIcon,
    CalendarIcon,
    TruckIcon,
    CreditCardIcon,
    GiftIcon,
    StarIcon as StarOutlineIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { ShippingAddress } from '../../types/checkout';
import { Review, Order, OrderItem } from '../../types';

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userReviews, setUserReviews] = useState<Review[]>([]);

    // Review state
    const [reviewProduct, setReviewProduct] = useState<{ productId: string, productName: string } | null>(null);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                // Fetch order details
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items(*)
                    `)
                    .eq('id', orderId)
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;

                if (!data) {
                    throw new Error('Order not found');
                }

                setOrder(data as Order);

                // Fetch user reviews to check which products have been reviewed
                const { data: reviewData, error: reviewError } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('user_id', user.id);

                if (reviewError) throw reviewError;
                setUserReviews(reviewData || []);
            } catch (error) {
                console.error('Error fetching order details:', error);
                setError('Failed to load order details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, user, navigate]);

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
            // Verify this is a completed/delivered order and belongs to the current user
            if (order.user_id !== user.id || (order.status !== 'completed' && order.status !== 'delivered')) {
                throw new Error('You can only review products from your completed orders');
            }

            // Check if the product is actually part of this order
            const isProductInOrder = order.order_items.some(item => item.product_id === reviewProduct.productId);

            if (!isProductInOrder) {
                throw new Error('You can only review products you have purchased');
            }

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

            setReviewProduct(null);
            setRating(5);
            setReviewText('');
            showNotification('Review submitted successfully', 'success');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
            showNotification(errorMessage, 'error');
        } finally {
            setReviewLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getDeliveryDate = () => {
        if (order?.delivery_date) {
            return formatDate(order.delivery_date);
        }
        return 'Not specified';
    };

    const getPaymentMethodText = () => {
        if (!order?.payment_method) return 'Not specified';

        if (order.payment_method === 'credit_card') {
            return 'Credit / Debit Card';
        } else if (order.payment_method === 'cash_on_delivery') {
            return 'Cash on Delivery';
        }

        return order.payment_method.replace('_', ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getPaymentStatusBadge = () => {
        if (!order) return null;

        if (order.payment_status === 'paid') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid
                </span>
            );
        } else if (order.payment_status === 'pending') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
        );
    };

    const getOrderStatusBadge = () => {
        if (!order) return null;

        switch (order.status) {
            case 'completed':
            case 'delivered':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                );
            case 'processing':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Processing
                    </span>
                );
            case 'shipped':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Shipped
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                );
        }
    };

    const getStatusTimeline = () => {
        if (!order) return null;

        const steps = [
            { status: 'pending', label: 'Order Placed', date: formatDate(order.created_at) },
            { status: 'processing', label: 'Processing' },
            { status: 'shipped', label: 'Shipped' },
            { status: 'delivered', label: 'Delivered' }
        ];

        // Find the current step
        const currentStepIndex = steps.findIndex(step => step.status === order.status);
        const currentStep = currentStepIndex !== -1 ? currentStepIndex : 0;

        return (
            <div className="flex items-center justify-between w-full mt-6">
                {steps.map((step, index) => (
                    <div key={step.status} className="flex flex-col items-center">
                        <div className="relative">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {index < currentStep ? '✓' : index + 1}
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`absolute top-1/2 h-0.5 w-12 -right-12 ${index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                                    }`}></div>
                            )}
                        </div>
                        <div className="mt-2 text-xs font-medium text-gray-700">{step.label}</div>
                        {step.date && <div className="text-xs text-gray-500">{step.date}</div>}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                        <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
                        <Link
                            to="/profile"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Back to Profile
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Review Modal */}
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

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Order header */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
                                <p className="mt-1 text-white text-opacity-80">
                                    Placed on {formatDate(order.created_at)}
                                </p>
                            </div>
                            <div>
                                {getOrderStatusBadge()}
                            </div>
                        </div>
                        {getStatusTimeline()}
                    </div>

                    {/* Order summary section */}
                    <div className="px-6 py-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Delivery information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <h3 className="text-sm font-medium text-gray-900">Delivery Information</h3>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {getDeliveryDate()}
                                    {order.delivery_time && <span> ({order.delivery_time})</span>}
                                </p>
                                {order.express_shipping && (
                                    <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Express Shipping
                                    </span>
                                )}
                            </div>

                            {/* Shipping information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <TruckIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <h3 className="text-sm font-medium text-gray-900">Shipping Address</h3>
                                </div>
                                {order.shipping_address ? (
                                    <div className="text-sm text-gray-500">
                                        <p className="font-medium">{order.shipping_address.name}</p>
                                        <p>{order.shipping_address.street}</p>
                                        <p>
                                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipcode}
                                        </p>
                                        <p>{order.shipping_address.country}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Not available</p>
                                )}
                            </div>

                            {/* Payment information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <h3 className="text-sm font-medium text-gray-900">Payment Information</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Method: {getPaymentMethodText()}
                                </p>
                                <div className="flex items-center">
                                    <p className="text-sm text-gray-500 mr-2">Status:</p>
                                    {getPaymentStatusBadge()}
                                </div>
                            </div>

                            {/* Gift information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <GiftIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <h3 className="text-sm font-medium text-gray-900">Gift Information</h3>
                                </div>
                                {order.gift_wrapping ? (
                                    <div className="text-sm text-gray-500">
                                        <p>Gift wrapping: Yes</p>
                                        {order.gift_note && (
                                            <div className="mt-2">
                                                <p className="font-medium">Gift Message:</p>
                                                <p className="italic">"{order.gift_note}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No gift wrapping</p>
                                )}
                            </div>
                        </div>

                        {/* Special instructions */}
                        {order.special_instructions && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h3>
                                <p className="text-sm text-gray-500">{order.special_instructions}</p>
                            </div>
                        )}

                        {/* Order items */}
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Product
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Quantity
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {order.order_items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.product_name}
                                                        </div>
                                                        {item.variation_name && (
                                                            <div className="text-sm text-gray-500">
                                                                {item.variation_name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ${item.price.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex space-x-2 justify-end">
                                                            <Link
                                                                to={`/shop/product/${item.product_id}`}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                View Product
                                                            </Link>

                                                            {(order.status === 'delivered' || order.status === 'completed') && (
                                                                <>
                                                                    {!hasBeenReviewed(item.product_id) ? (
                                                                        <button
                                                                            onClick={() => setReviewProduct({
                                                                                productId: item.product_id,
                                                                                productName: item.product_name
                                                                            })}
                                                                            className="text-indigo-600 hover:text-indigo-900"
                                                                        >
                                                                            Write Review
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-green-600">
                                                                            Reviewed
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Order totals */}
                        <div className="mt-8 sm:ml-auto sm:w-1/2 md:w-1/3 lg:w-1/4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span>${(order.total - (order.shipping_fee || 0) - (order.gift_wrapping_fee || 0)).toFixed(2)}</span>
                                </div>
                                {(order.shipping_fee || order.express_shipping) && (
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Shipping{order.express_shipping ? ' (Express)' : ''}</span>
                                        <span>${(order.shipping_fee || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.gift_wrapping && (
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Gift Wrapping</span>
                                        <span>${(order.gift_wrapping_fee || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-medium text-gray-900">
                                    <span>Total</span>
                                    <span>${order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <Link
                                to="/profile"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Back to Orders
                            </Link>

                            {(order.status === 'shipped' || order.status === 'delivered') && (
                                <button
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Track Shipment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage; 