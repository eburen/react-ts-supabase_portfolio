import { useState, useEffect } from 'react';
import { verifyCoupon } from '../../lib/api';
import { TagIcon, XMarkIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface CouponApplierProps {
    subTotal: number;
    onApplied: (discount: number, code: string) => void;
    onRemove: () => void;
    appliedCouponCode?: string;
    appliedDiscount?: number;
}

const CouponApplier = ({
    subTotal,
    onApplied,
    onRemove,
    appliedCouponCode,
    appliedDiscount
}: CouponApplierProps) => {
    const [couponCode, setCouponCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // If there's an already applied coupon, update the state
    useEffect(() => {
        if (appliedCouponCode) {
            setCouponCode(appliedCouponCode);
        }
    }, [appliedCouponCode]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setError('Please enter a coupon code');
            return;
        }

        setIsVerifying(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await verifyCoupon(couponCode, subTotal);

            if (result.valid && result.discount) {
                setSuccess(result.message);
                onApplied(result.discount, couponCode);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to verify coupon. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setSuccess(null);
        setError(null);
        onRemove();
    };

    if (appliedCouponCode && appliedDiscount) {
        return (
            <div className="bg-green-50 p-4 rounded-md mt-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                        <div>
                            <p className="font-medium text-green-800">
                                Coupon <span className="font-bold">{appliedCouponCode}</span> applied
                            </p>
                            <p className="text-sm text-green-700">
                                You saved ${appliedDiscount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Remove
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <h3 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                <TagIcon className="h-5 w-5 mr-1 text-gray-500" />
                Apply Coupon Code
            </h3>
            <div className="flex space-x-2">
                <div className="flex-grow">
                    <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                        placeholder="Enter coupon code"
                        className="block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {error && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center mt-1 text-sm text-green-600">
                            <CheckIcon className="h-4 w-4 mr-1" />
                            {success}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isVerifying}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isVerifying ? 'Checking...' : 'Apply'}
                </button>
            </div>
        </div>
    );
};

export default CouponApplier; 