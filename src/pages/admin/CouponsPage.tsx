import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Coupon } from '../../types';
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import {
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { checkIsAdmin } from '../../lib/supabase';

const CouponsPage = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { user } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_purchase: '',
        expiry_date: '',
        is_active: true
    });

    // Check admin status on component mount
    useEffect(() => {
        const verifyAdminStatus = async () => {
            const adminStatus = await checkIsAdmin();
            setIsAdmin(adminStatus);

            if (!adminStatus) {
                setError('You do not have permission to manage coupons. Admin role is required.');
            } else {
                loadCoupons();
            }
        };

        if (user) {
            verifyAdminStatus();
        } else {
            setError('You must be logged in with admin privileges to manage coupons.');
            setLoading(false);
        }
    }, [user]);

    const loadCoupons = async () => {
        setLoading(true);
        setError(null);

        const { data, error } = await fetchCoupons();

        if (error) {
            setError('Failed to load coupons: ' + error);
        } else if (data) {
            setCoupons(data as Coupon[]);
        }

        setLoading(false);
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
        setError(null);
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
        setError(null);
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

    const validateForm = () => {
        if (!formData.code.trim()) {
            setError('Coupon code is required');
            return false;
        }

        const discountValue = parseFloat(formData.discount_value);
        if (isNaN(discountValue) || discountValue <= 0) {
            setError('Discount value must be greater than 0');
            return false;
        }

        if (formData.discount_type === 'percentage' && discountValue > 100) {
            setError('Percentage discount cannot exceed 100%');
            return false;
        }

        if (formData.minimum_purchase && (isNaN(parseFloat(formData.minimum_purchase)) || parseFloat(formData.minimum_purchase) < 0)) {
            setError('Minimum purchase must be a positive number or empty');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!isAdmin) {
            setError('You do not have permission to manage coupons. Admin role is required.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const couponData = {
                code: formData.code.toUpperCase().trim(),
                discount_type: formData.discount_type as 'percentage' | 'fixed',
                discount_value: parseFloat(formData.discount_value),
                minimum_purchase: formData.minimum_purchase ? parseFloat(formData.minimum_purchase) : null,
                expiry_date: formData.expiry_date || null,
                is_active: formData.is_active
            };

            if (editingCoupon) {
                // Update existing coupon
                const { data, error } = await updateCoupon(editingCoupon.id, couponData);

                if (error) throw new Error(error);

                // Update state with returned data
                if (data && data.length > 0) {
                    setCoupons(coupons.map(c =>
                        c.id === editingCoupon.id ? data[0] as Coupon : c
                    ));
                }
            } else {
                // Create new coupon
                const { data, error } = await createCoupon(couponData);

                if (error) throw new Error(error);

                if (data && data.length > 0) {
                    setCoupons([data[0] as Coupon, ...coupons]);
                }
            }

            // Reset form and close
            resetForm();
            setShowForm(false);
        } catch (error: unknown) {
            const err = error as Error;
            let errorMessage = err.message || 'Failed to save coupon. Please try again.';

            // Check for RLS policy violation
            if (errorMessage.includes('violates row-level security policy')) {
                errorMessage = 'Permission denied: You need admin privileges to manage coupons.';
            }

            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!isAdmin) {
            setError('You do not have permission to delete coupons. Admin role is required.');
            return;
        }

        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                setError(null);
                const { error } = await deleteCoupon(id);

                if (error) throw new Error(error);

                // Remove from state
                setCoupons(coupons.filter(c => c.id !== id));
            } catch (error: unknown) {
                const err = error as Error;
                let errorMessage = err.message || 'Failed to delete coupon';

                // Check for RLS policy violation
                if (errorMessage.includes('violates row-level security policy')) {
                    errorMessage = 'Permission denied: You need admin privileges to delete coupons.';
                }

                setError(errorMessage);
            }
        }
    };

    const handleToggleCouponStatus = async (coupon: Coupon) => {
        if (!isAdmin) {
            setError('You do not have permission to update coupon status. Admin role is required.');
            return;
        }

        try {
            setError(null);
            const newStatus = !coupon.is_active;

            const { data, error } = await toggleCouponStatus(coupon.id, newStatus);

            if (error) throw new Error(error);

            // Update state with returned data to ensure we have the latest
            if (data && data.length > 0) {
                setCoupons(coupons.map(c =>
                    c.id === coupon.id ? data[0] as Coupon : c
                ));
            }
        } catch (error: unknown) {
            const err = error as Error;
            let errorMessage = err.message || 'Failed to update coupon status';

            // Check for RLS policy violation
            if (errorMessage.includes('violates row-level security policy')) {
                errorMessage = 'Permission denied: You need admin privileges to update coupon status.';
            }

            setError(errorMessage);
        }
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'No expiry';
        return new Date(dateString).toLocaleDateString();
    };

    if (!user) {
        return (
            <AdminLayout>
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="sm:flex sm:items-center">
                        <div className="sm:flex-auto">
                            <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
                        </div>
                    </div>
                    <div className="mt-6 rounded-md bg-yellow-50 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>You must be logged in with admin privileges to manage coupons.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

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
                    {isAdmin && (
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
                    )}
                    {isAdmin && (
                        <div className="mt-4 sm:mt-0 sm:ml-4 sm:flex-none">
                            <div className="inline-flex items-center justify-center rounded-md border border-green-100 bg-green-50 px-3 py-1 text-sm text-green-800">
                                <ShieldCheckIcon className="mr-1 h-4 w-4 text-green-600" />
                                Admin Access
                            </div>
                        </div>
                    )}
                </div>

                {/* Error display */}
                {error && (
                    <div className="mt-4 rounded-md bg-red-50 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Coupon Form */}
                {showForm && isAdmin && (
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
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md uppercase"
                                                placeholder="e.g., SUMMER10"
                                                disabled={submitting || (!!editingCoupon)}
                                            />
                                        </div>
                                        {!!editingCoupon && (
                                            <p className="mt-1 text-xs text-gray-500">Coupon code cannot be changed</p>
                                        )}
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
                                                disabled={submitting}
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
                                                disabled={submitting}
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
                                                disabled={submitting}
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
                                                disabled={submitting}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">Leave blank for no expiry</p>
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
                                                    disabled={submitting}
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
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            editingCoupon ? 'Update' : 'Create'
                                        )}
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
                                                {coupons.map((coupon) => {
                                                    const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
                                                    return (
                                                        <tr key={coupon.id}>
                                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900 sm:pl-6">
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
                                                                <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                                                                    {formatDate(coupon.expiry_date)}
                                                                </span>
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                                <button
                                                                    onClick={() => handleToggleCouponStatus(coupon)}
                                                                    disabled={!isAdmin}
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.is_active && !isExpired
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                        } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    {coupon.is_active && !isExpired ? (
                                                                        <>
                                                                            <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                                                                            Active
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircleIcon className="mr-1.5 h-4 w-4" />
                                                                            {isExpired ? 'Expired' : 'Inactive'}
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </td>
                                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                                {isAdmin && (
                                                                    <div className="flex justify-end space-x-3">
                                                                        <button
                                                                            onClick={() => openEditForm(coupon)}
                                                                            className="text-indigo-600 hover:text-indigo-900"
                                                                        >
                                                                            <PencilIcon className="h-5 w-5" />
                                                                            <span className="sr-only">Edit</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteCoupon(coupon.id)}
                                                                            className="text-red-600 hover:text-red-900"
                                                                        >
                                                                            <TrashIcon className="h-5 w-5" />
                                                                            <span className="sr-only">Delete</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="py-10 text-center">
                                            <p className="text-gray-500">No coupons found. Create one to get started.</p>
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