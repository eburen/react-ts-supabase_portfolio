import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { SalesData } from '../../types';

const AnalyticsPage = () => {
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalSales, setTotalSales] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [avgOrderValue, setAvgOrderValue] = useState(0);

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeframe]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);

            // Calculate date range based on timeframe
            const endDate = new Date();
            const startDate = new Date();

            if (timeframe === 'week') {
                startDate.setDate(endDate.getDate() - 7);
            } else if (timeframe === 'month') {
                startDate.setMonth(endDate.getMonth() - 1);
            } else {
                startDate.setFullYear(endDate.getFullYear() - 1);
            }

            const startDateStr = startDate.toISOString();

            // Fetch total sales and orders
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('id, total, created_at')
                .gte('created_at', startDateStr)
                .order('created_at', { ascending: false });

            if (orderError) throw orderError;

            // Process sales data by date
            const salesByDate = new Map<string, { total_sales: number; order_count: number }>();

            if (orderData) {
                // Calculate totals
                const totalSalesAmount = orderData.reduce((sum, order) => sum + parseFloat(order.total), 0);
                const averageOrder = orderData.length > 0 ? totalSalesAmount / orderData.length : 0;

                setTotalSales(totalSalesAmount);
                setTotalOrders(orderData.length);
                setAvgOrderValue(averageOrder);

                // Group by date
                orderData.forEach(order => {
                    const dateStr = new Date(order.created_at).toLocaleDateString();
                    const currentValue = salesByDate.get(dateStr) || { total_sales: 0, order_count: 0 };

                    salesByDate.set(dateStr, {
                        total_sales: currentValue.total_sales + parseFloat(order.total),
                        order_count: currentValue.order_count + 1
                    });
                });

                // Convert to array for chart
                const salesDataArray: SalesData[] = Array.from(salesByDate.entries())
                    .map(([date, data]) => ({
                        date,
                        total_sales: data.total_sales,
                        order_count: data.order_count
                    }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setSalesData(salesDataArray);
            }

            // Fetch top selling products
            const { data: productData, error: productError } = await supabase
                .from('order_items')
                .select(`
          product_id,
          product_name,
          quantity,
          price,
          orders!inner(created_at)
        `)
                .gte('orders.created_at', startDateStr);

            if (productError) throw productError;

            if (productData) {
                // Aggregate product sales
                const productSales = new Map<string, {
                    product_id: string;
                    product_name: string;
                    total_quantity: number;
                    total_revenue: number;
                }>();

                productData.forEach(item => {
                    const currentValue = productSales.get(item.product_id) || {
                        product_id: item.product_id,
                        product_name: item.product_name,
                        total_quantity: 0,
                        total_revenue: 0
                    };

                    productSales.set(item.product_id, {
                        ...currentValue,
                        total_quantity: currentValue.total_quantity + item.quantity,
                        total_revenue: currentValue.total_revenue + (item.price * item.quantity)
                    });
                });

                // Convert to sorted array
                const topProductsArray = Array.from(productSales.values())
                    .sort((a, b) => b.total_revenue - a.total_revenue)
                    .slice(0, 5);

                setTopProducts(topProductsArray);
            }

        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <AdminLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-gray-900">Sales Analytics</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            View sales performance and trends for your store.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <select
                            id="timeframe"
                            name="timeframe"
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
                        >
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="year">Last Year</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="mt-6 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats overview */}
                        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                            {/* Total Sales */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                                                <dd className="text-lg font-semibold text-gray-900">{formatCurrency(totalSales)}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Orders */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-emerald-500 rounded-md p-3">
                                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                                                <dd className="text-lg font-semibold text-gray-900">{totalOrders}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Average Order Value */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Average Order</dt>
                                                <dd className="text-lg font-semibold text-gray-900">{formatCurrency(avgOrderValue)}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Sales Chart (placeholder for actual chart) */}
                            <div className="bg-white shadow sm:rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Sales Over Time</h3>

                                    {salesData.length > 0 ? (
                                        <div className="mt-4">
                                            <div className="h-80 border-b border-gray-200 overflow-hidden">
                                                <div className="flex h-full items-end space-x-2 px-4">
                                                    {salesData.map((data, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex-1 flex flex-col items-center"
                                                        >
                                                            <div
                                                                className="w-full bg-indigo-500 rounded-t"
                                                                style={{ height: `${(data.total_sales / (Math.max(...salesData.map(d => d.total_sales)) || 1)) * 100}%` }}
                                                            ></div>
                                                            <div className="mt-2 text-xs text-gray-500 truncate w-full text-center">
                                                                {data.date.split('/').slice(0, 2).join('/')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-6 text-center text-sm text-gray-500">
                                                {timeframe === 'week' ? 'Daily sales for the last 7 days' :
                                                    timeframe === 'month' ? 'Daily sales for the last 30 days' :
                                                        'Monthly sales for the last year'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-6 py-10 text-center">
                                            <p className="text-gray-500">No sales data available for this period</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white shadow sm:rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Top Selling Products</h3>

                                    {topProducts.length > 0 ? (
                                        <div className="mt-4 flow-root">
                                            <ul className="-my-5 divide-y divide-gray-200">
                                                {topProducts.map((product) => (
                                                    <li key={product.product_id} className="py-4">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
                                                                <p className="text-sm text-gray-500 truncate">{product.total_quantity} units sold</p>
                                                            </div>
                                                            <div className="text-right text-sm font-medium text-gray-900">
                                                                {formatCurrency(product.total_revenue)}
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="mt-6 py-10 text-center">
                                            <p className="text-gray-500">No product data available for this period</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AnalyticsPage; 