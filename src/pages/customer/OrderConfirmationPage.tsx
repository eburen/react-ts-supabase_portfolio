import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { CheckCircleIcon, CalendarIcon, TruckIcon, CreditCardIcon, GiftIcon, TagIcon } from '@heroicons/react/24/outline';
import { ShippingAddress, PaymentMethod, PaymentStatus } from '../../types/checkout';

interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    variation_id?: string;
    variation_name?: string;
    quantity: number;
    price: number;
    created_at: string;
    updated_at: string;
}

interface Order {
    id: string;
    user_id: string;
    status: string;
    total: number;
    shipping_address?: ShippingAddress;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    delivery_date?: string;
    delivery_time?: string;
    gift_wrapping: boolean;
    gift_note?: string;
    special_instructions?: string;
    express_shipping: boolean;
    shipping_fee?: number;
    gift_wrapping_fee?: number;
    coupon_code?: string;
    coupon_discount?: number;
    created_at: string;
    updated_at: string;
    order_items: OrderItem[];
}

const OrderConfirmationPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
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
            } catch (error) {
                console.error('Error fetching order details:', error);
                setError('Failed to load order details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, user, navigate]);

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
                            Go to Profile
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getDeliveryDate = () => {
        if (order.delivery_date) {
            return formatDate(order.delivery_date);
        }
        return 'Not specified';
    };

    const getPaymentMethodText = () => {
        if (order.payment_method === 'credit_card') {
            return 'Credit / Debit Card';
        } else if (order.payment_method === 'cash_on_delivery') {
            return 'Cash on Delivery';
        }
        return order.payment_method;
    };

    const getPaymentStatusBadge = () => {
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
                Failed
            </span>
        );
    };

    const getOrderStatusBadge = () => {
        switch (order.status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
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
                        {order.status}
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Order confirmation header */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-12 text-center text-white">
                        <CheckCircleIcon className="h-16 w-16 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold">Thank you for your order!</h1>
                        <p className="mt-2 text-white text-opacity-90">
                            Your order has been placed and is being processed.
                        </p>
                        <div className="mt-4">
                            <span className="inline-block bg-white bg-opacity-20 rounded-lg px-4 py-2">
                                Order #{order.id.slice(0, 8)}
                            </span>
                        </div>
                    </div>

                    {/* Order summary section */}
                    <div className="px-6 py-8">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900 mb-1">Order Status</h2>
                                <div className="flex items-center">
                                    {getOrderStatusBadge()}
                                    <span className="ml-2 text-sm text-gray-500">
                                        Placed on {formatDate(order.created_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Link
                                    to="/shop"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
                                >
                                    Continue Shopping
                                </Link>

                                <Link
                                    to="/profile"
                                    className="ml-0 md:ml-4 mt-2 md:mt-0 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full md:w-auto"
                                >
                                    View All Orders
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Delivery information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <h3 className="text-sm font-medium text-gray-900">Delivery Date</h3>
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
                            <div className="mb-8 bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h3>
                                <p className="text-sm text-gray-500">{order.special_instructions}</p>
                            </div>
                        )}

                        {/* Order items */}
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
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
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {order.order_items.map((item: OrderItem) => (
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Order totals */}
                        <div className="mt-8 sm:ml-auto sm:w-1/2 md:w-1/3 lg:w-1/4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span>${(order.total - (order.shipping_fee || 0) - (order.gift_wrapping_fee || 0) + (order.coupon_discount || 0)).toFixed(2)}</span>
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
                                {order.coupon_code && order.coupon_discount && order.coupon_discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span className="flex items-center">
                                            <TagIcon className="h-4 w-4 mr-1" />
                                            Coupon ({order.coupon_code})
                                        </span>
                                        <span>-${order.coupon_discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-medium text-gray-900">
                                    <span>Total</span>
                                    <span>${order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage; 