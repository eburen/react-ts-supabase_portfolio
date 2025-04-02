import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Coupon } from '../../types';
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const CouponsPage = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_purchase: '',
        expiry_date: '',
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (data) {
                setCoupons(data as Coupon[]);
            }
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            discount_type: 'percentage',
            discount_value: '',
            minimum_purchase: '',
            expiry_date: '',
            is_active: true
        });
        setEditingCoupon(null);
    };

    const openEditForm = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            minimum_purchase: coupon.minimum_purchase ? coupon.minimum_purchase.toString() : '',
            expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
            is_active: coupon.is_active
        });
        setShowForm(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData({
                ...formData,
                [name]: checked
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const couponData = {
                code: formData.code,
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value),
                minimum_purchase: formData.minimum_purchase ? parseFloat(formData.minimum_purchase) : null,
                expiry_date: formData.expiry_date || null,
                is_active: formData.is_active
            };

            if (editingCoupon) {
                // Update existing coupon
                const { error } = await supabase
                    .from('coupons')
                    .update(couponData)
                    .eq('id', editingCoupon.id);

                if (error) throw error;

                // Update state
                setCoupons(coupons.map(c =>
                    c.id === editingCoupon.id ? { ...c, ...couponData } : c
                ));
            } else {
                // Create new coupon
                const { data, error } = await supabase
                    .from('coupons')
                    .insert([couponData])
                    .select();

                if (error) throw error;

                if (data) {
                    setCoupons([data[0] as Coupon, ...coupons]);
                }
            }

            // Reset form and close
            resetForm();
            setShowForm(false);
        } catch (error) {
            console.error('Error saving coupon:', error);
            alert('Failed to save coupon. Please try again.');
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                const { error } = await supabase
                    .from('coupons')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                // Remove from state
                setCoupons(coupons.filter(c => c.id !== id));
            } catch (error) {
                console.error('Error deleting coupon:', error);
                alert('Failed to delete coupon. Please try again.');
            }
        }
    };

    const toggleCouponStatus = async (coupon: Coupon) => {
        try {
            const newStatus = !coupon.is_active;

            const { error } = await supabase
                .from('coupons')
                .update({ is_active: newStatus })
                .eq('id', coupon.id);

            if (error) throw error;

            // Update state
            setCoupons(coupons.map(c =>
                c.id === coupon.id ? { ...c, is_active: newStatus } : c
            ));
        } catch (error) {
            console.error('Error updating coupon status:', error);
            alert('Failed to update coupon status. Please try again.');
        }
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'No expiry';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AdminLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage discount coupons for your store.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setShowForm(!showForm);
                            }}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Add Coupon
                        </button>
                    </div>
                </div>

                {/* Coupon Form */}
                {showForm && (
                    <div className="mt-8 bg-white overflow-hidden shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h3>
                            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    {/* Coupon Code */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                            Coupon Code
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="code"
                                                id="code"
                                                required
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Discount Type */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">
                                            Discount Type
                                        </label>
                                        <div className="mt-1">
                                            <select
                                                id="discount_type"
                                                name="discount_type"
                                                value={formData.discount_type}
                                                onChange={handleInputChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            >
                                                <option value="percentage">Percentage</option>
                                                <option value="fixed">Fixed Amount</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Discount Value */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">
                                            {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="number"
                                                name="discount_value"
                                                id="discount_value"
                                                required
                                                min="0"
                                                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                                                max={formData.discount_type === 'percentage' ? '100' : undefined}
                                                value={formData.discount_value}
                                                onChange={handleInputChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Minimum Purchase */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="minimum_purchase" className="block text-sm font-medium text-gray-700">
                                            Minimum Purchase ($)
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="number"
                                                name="minimum_purchase"
                                                id="minimum_purchase"
                                                min="0"
                                                step="0.01"
                                                value={formData.minimum_purchase}
                                                onChange={handleInputChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>

                                    {/* Expiry Date */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700">
                                            Expiry Date
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="date"
                                                name="expiry_date"
                                                id="expiry_date"
                                                value={formData.expiry_date}
                                                onChange={handleInputChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Is Active */}
                                    <div className="sm:col-span-3">
                                        <div className="relative flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="is_active"
                                                    name="is_active"
                                                    type="checkbox"
                                                    checked={formData.is_active}
                                                    onChange={handleInputChange}
                                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="is_active" className="font-medium text-gray-700">
                                                    Active
                                                </label>
                                                <p className="text-gray-500">Coupon is available for use</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetForm();
                                            setShowForm(false);
                                        }}
                                        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        {editingCoupon ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="mt-6 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="mt-8 flex flex-col">
                        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                    {coupons.length > 0 ? (
                                        <table className="min-w-full divide-y divide-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                        Code
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Discount
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Min Purchase
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Expiry Date
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Status
                                                    </th>
                                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {coupons.map((coupon) => (
                                                    <tr key={coupon.id}>
                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                            {coupon.code}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {coupon.discount_type === 'percentage'
                                                                ? `${coupon.discount_value}%`
                                                                : `$${coupon.discount_value.toFixed(2)}`}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {coupon.minimum_purchase
                                                                ? `$${coupon.minimum_purchase.toFixed(2)}`
                                                                : 'None'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {formatDate(coupon.expiry_date)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            <button
                                                                onClick={() => toggleCouponStatus(coupon)}
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.is_active
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}
                                                            >
                                                                {coupon.is_active ? (
                                                                    <>
                                                                        <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                                                                        Active
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircleIcon className="mr-1.5 h-4 w-4" />
                                                                        Inactive
                                                                    </>
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                            <div className="flex justify-end space-x-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditForm(coupon)}
                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                >
                                                                    <PencilIcon className="h-5 w-5" aria-hidden="true" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="py-10 text-center">
                                            <p className="text-gray-500">No coupons found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default CouponsPage; 