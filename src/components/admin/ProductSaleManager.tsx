import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ProductVariation } from '../../types';
import { XMarkIcon, TagIcon } from '@heroicons/react/24/outline';

interface Sale {
    id: string;
    product_id: string;
    variation_id?: string | null;
    discount_percentage: number;
    start_date: string;
    end_date: string;
    active: boolean;
}

interface ProductSaleManagerProps {
    productId: string;
    variations: ProductVariation[];
    refreshProductDetails?: () => void;
}

const ProductSaleManager = ({ productId, variations, refreshProductDetails }: ProductSaleManagerProps) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [applyTo, setApplyTo] = useState<'product' | 'variation'>('product');
    const [variationId, setVariationId] = useState<string>('');
    const [discountPercentage, setDiscountPercentage] = useState<number>(10);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        fetchSales();

        // Set today as default start date
        const today = new Date();
        setStartDate(today.toISOString().split('T')[0]);

        // Set 7 days from now as default end date
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setEndDate(nextWeek.toISOString().split('T')[0]);
    }, [productId]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('product_sales')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setSales(data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
            setError('Failed to load product sales');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSale = async () => {
        if (discountPercentage <= 0 || discountPercentage > 100) {
            setError('Discount percentage must be between 1 and 100');
            return;
        }

        if (!startDate || !endDate) {
            setError('Start and end dates are required');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError('End date must be after start date');
            return;
        }

        const saleData = {
            product_id: productId,
            variation_id: applyTo === 'variation' ? variationId : null,
            discount_percentage: discountPercentage,
            start_date: startDate,
            end_date: endDate,
            active: true
        };

        try {
            // Check if there's already an active sale for this product/variation
            const existingSaleQuery = supabase
                .from('product_sales')
                .select('*')
                .eq('product_id', productId)
                .eq('active', true);

            if (applyTo === 'variation') {
                existingSaleQuery.eq('variation_id', variationId);
            } else {
                existingSaleQuery.is('variation_id', null);
            }

            const { data: existingSale } = await existingSaleQuery;

            if (existingSale && existingSale.length > 0) {
                // Deactivate existing sales
                await supabase
                    .from('product_sales')
                    .update({ active: false })
                    .eq('id', existingSale[0].id);
            }

            // Add new sale
            const { error } = await supabase
                .from('product_sales')
                .insert([saleData]);

            if (error) throw error;

            setIsAdding(false);
            resetForm();
            fetchSales();

            if (refreshProductDetails) {
                refreshProductDetails();
            }
        } catch (error) {
            console.error('Error adding sale:', error);
            setError('Failed to add sale');
        }
    };

    const handleEndSale = async (saleId: string) => {
        if (window.confirm('Are you sure you want to end this sale?')) {
            try {
                const { error } = await supabase
                    .from('product_sales')
                    .update({ active: false })
                    .eq('id', saleId);

                if (error) throw error;

                fetchSales();

                if (refreshProductDetails) {
                    refreshProductDetails();
                }
            } catch (error) {
                console.error('Error ending sale:', error);
                setError('Failed to end sale');
            }
        }
    };

    const handleDeleteSale = async (saleId: string) => {
        if (window.confirm('Are you sure you want to delete this sale?')) {
            try {
                const { error } = await supabase
                    .from('product_sales')
                    .delete()
                    .eq('id', saleId);

                if (error) throw error;

                fetchSales();

                if (refreshProductDetails) {
                    refreshProductDetails();
                }
            } catch (error) {
                console.error('Error deleting sale:', error);
                setError('Failed to delete sale');
            }
        }
    };

    const resetForm = () => {
        setApplyTo('product');
        setVariationId('');
        setDiscountPercentage(10);
        setError(null);
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Product Sales
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Apply discounts to products or specific variations
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <TagIcon className="-ml-0.5 mr-2 h-4 w-4" />
                    Add Sale
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="mx-4 my-2 rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-sm text-red-700 mt-2">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Add sale form */}
            {isAdding && (
                <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="applyTo" className="block text-sm font-medium text-gray-700">
                                Apply to
                            </label>
                            <select
                                id="applyTo"
                                value={applyTo}
                                onChange={(e) => setApplyTo(e.target.value as 'product' | 'variation')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="product">Entire Product</option>
                                <option value="variation">Specific Variation</option>
                            </select>
                        </div>

                        {applyTo === 'variation' && (
                            <div className="sm:col-span-3">
                                <label htmlFor="variationId" className="block text-sm font-medium text-gray-700">
                                    Variation
                                </label>
                                <select
                                    id="variationId"
                                    value={variationId}
                                    onChange={(e) => setVariationId(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required={applyTo === 'variation'}
                                >
                                    <option value="">Select a variation</option>
                                    {variations.map((variation) => (
                                        <option key={variation.id} value={variation.id}>
                                            {variation.type}: {variation.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700">
                                Discount (%)
                            </label>
                            <input
                                type="number"
                                id="discountPercentage"
                                value={discountPercentage}
                                onChange={(e) => setDiscountPercentage(parseFloat(e.target.value))}
                                min="1"
                                max="100"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAddSale}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Apply Sale
                        </button>
                    </div>
                </div>
            )}

            {/* Sales list */}
            <div className="border-t border-gray-200">
                {loading ? (
                    <div className="flex justify-center items-center h-20">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                        No sales added yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Applied To
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sales.map((sale) => {
                                    const variation = variations.find(v => v.id === sale.variation_id);
                                    const isActive = sale.active && new Date(sale.end_date) >= new Date();
                                    const hasStarted = new Date(sale.start_date) <= new Date();
                                    const hasEnded = new Date(sale.end_date) < new Date();

                                    let status = 'Inactive';
                                    if (sale.active) {
                                        if (hasEnded) {
                                            status = 'Ended';
                                        } else if (hasStarted) {
                                            status = 'Active';
                                        } else {
                                            status = 'Scheduled';
                                        }
                                    }

                                    return (
                                        <tr key={sale.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {sale.variation_id ? (
                                                    <span>
                                                        {variation ? (
                                                            <span className="font-medium">
                                                                {variation.type}: {variation.name}
                                                            </span>
                                                        ) : (
                                                            'Unknown variation'
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="font-medium">Entire Product</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {sale.discount_percentage}% OFF
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(sale.start_date)} - {formatDate(sale.end_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {status === 'Active' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                )}
                                                {status === 'Scheduled' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Scheduled
                                                    </span>
                                                )}
                                                {status === 'Ended' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Ended
                                                    </span>
                                                )}
                                                {status === 'Inactive' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-3">
                                                    {isActive && (
                                                        <button
                                                            onClick={() => handleEndSale(sale.id)}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                        >
                                                            End Sale
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteSale(sale.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductSaleManager; 