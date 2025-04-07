import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, OrderStatus } from '../../types';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';

interface ExtendedOrder extends Order {
    users?: {
        full_name: string;
        email: string;
    };
    order_items: OrderItem[];
}

const OrderDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [order, setOrder] = useState<ExtendedOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<OrderStatus>('pending');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchOrderDetails = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    users:user_id (full_name, email),
                    order_items(*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setOrder(data as ExtendedOrder);
                setCurrentStatus(data.status as OrderStatus);
            } else {
                setError('Order not found');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    const updateOrderStatus = async () => {
        if (currentStatus === order.status) return;

        setUpdatingStatus(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: currentStatus })
                .eq('id', order.id);

            if (error) throw error;

            // Update local order state
            if (order) {
                setOrder({ ...order, status: currentStatus });
            }

            showNotification(`Order status updated to ${currentStatus}`, 'success');
        } catch (error) {
            console.error('Error updating order status:', error);
            showNotification('Failed to update order status', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-purple-100 text-purple-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'returned':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const statusOptions: { label: string; value: OrderStatus }[] = [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Returned', value: 'returned' }
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (error || !order) {
        return (
            <AdminLayout>
                <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                        <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-sm text-red-700 mt-2">{error || 'Order not found'}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/orders')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Back to Orders
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        to="/admin/orders"
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    >
                        <ArrowLeftIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                        Back to Orders
                    </Link>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Order Details
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Order #{order.id.substring(0, 8)}...
                            </p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(order.status as OrderStatus)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {order.users?.full_name || 'Unknown'}<br />
                                    <span className="text-gray-500">{order.users?.email}</span>
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatDate(order.created_at)}
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    ${parseFloat(order.total.toString()).toFixed(2)}
                                </dd>
                            </div>
                            {order.discount_amount !== undefined && order.discount_amount > 0 && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Discount</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        ${parseFloat(order.discount_amount.toString()).toFixed(2)}
                                    </dd>
                                </div>
                            )}
                            {order.shipping_address && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <div>
                                            <p>{order.shipping_address.name}</p>
                                            <p>{order.shipping_address.street}</p>
                                            <p>
                                                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipcode}
                                            </p>
                                            <p>{order.shipping_address.country}</p>
                                        </div>
                                    </dd>
                                </div>
                            )}
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <div className="flex items-center">
                                        <select
                                            id="status"
                                            name="status"
                                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                            value={currentStatus}
                                            onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
                                        >
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            onClick={updateOrderStatus}
                                            disabled={updatingStatus || currentStatus === order.status}
                                        >
                                            {updatingStatus ? 'Updating...' : 'Update Status'}
                                        </button>
                                    </div>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Order Items */}
                <div className="mt-8">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Order Items
                    </h3>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Variation
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {order.order_items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.product_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.variation_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${item.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <th scope="row" colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                        Total
                                    </th>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ${parseFloat(order.total.toString()).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default OrderDetailPage; 