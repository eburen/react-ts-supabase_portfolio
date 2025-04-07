import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { verifyCoupon } from '../../lib/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';

const CartPage = () => {
    const { cartItems, updateCartItemQuantity, removeFromCart, clearCart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState<string | null>(null);
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
    } | null>(null);

    // Empty cart state
    if (cartItems.length === 0) {
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <div className="inline-block p-6 rounded-full bg-gray-100 mb-6">
                            <svg className="w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Your cart is empty</h1>
                        <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
                            Looks like you haven't added any products to your cart yet.
                        </p>
                        <Link to="/shop" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setCouponError(null);

        try {
            // Verify the coupon with the API
            const result = await verifyCoupon(couponCode, cartTotal);

            if (result.valid && result.discount) {
                setAppliedCoupon({
                    code: couponCode.toUpperCase(),
                    discountType: result.discountType || 'percentage',
                    discountValue: result.discountValue || result.discount
                });
                setCouponError(null);
            } else {
                setCouponError(result.message || 'Invalid coupon code');
                setAppliedCoupon(null);
            }
        } catch (error) {
            console.error('Error verifying coupon:', error);
            setCouponError('Error verifying coupon. Please try again.');
            setAppliedCoupon(null);
        }

        setCouponCode('');
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
    };

    const calculateDiscount = () => {
        if (!appliedCoupon) return 0;

        if (appliedCoupon.discountType === 'percentage') {
            return (cartTotal * appliedCoupon.discountValue) / 100;
        }

        return appliedCoupon.discountValue;
    };

    const discount = calculateDiscount();
    const finalTotal = cartTotal - discount;
    const shippingCost = finalTotal > 100 ? 0 : 10; // Free shipping over $100
    const orderTotal = finalTotal + shippingCost;

    const handleCheckout = () => {
        if (!user) {
            if (window.confirm('Please log in to proceed to checkout. Go to login page?')) {
                navigate('/login');
            }
            return;
        }

        // Check if cart is empty
        if (cartItems.length === 0) {
            showNotification('Your cart is empty. Please add items before checkout.', 'error');
            return;
        }

        // Set a flag in localStorage to indicate we're coming from the cart page with items
        localStorage.setItem('validCheckout', 'true');

        // Navigate to checkout
        navigate('/checkout', { replace: true });
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

                <div className="mt-8">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
                        <section aria-labelledby="cart-heading" className="lg:col-span-7">
                            <h2 id="cart-heading" className="sr-only">Items in your shopping cart</h2>

                            <ul role="list" className="border-t border-b border-gray-200 divide-y divide-gray-200">
                                {cartItems.map((item) => (
                                    <li key={item.id} className="py-6 flex">
                                        <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name || 'Product'}
                                                    className="w-full h-full object-center object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-4 flex-1 flex flex-col">
                                            <div>
                                                <div className="flex justify-between text-base font-medium text-gray-900">
                                                    <h3>
                                                        <Link to={`/product/${item.product_id}`}>
                                                            {item.name || 'Product'}
                                                        </Link>
                                                    </h3>
                                                    <p className="ml-4">${((item.price || 0) * item.quantity).toFixed(2)}</p>
                                                </div>
                                                {item.variation_name && (
                                                    <p className="mt-1 text-sm text-gray-500">Variation: {item.variation_name}</p>
                                                )}

                                                {/* Product price with sale information */}
                                                <div className="mt-1 text-sm">
                                                    {item.original_price && item.original_price > item.price ? (
                                                        <div className="flex items-center">
                                                            <span className="text-red-600 font-medium">
                                                                ${(item.price || 0).toFixed(2)} each
                                                            </span>
                                                            <span className="ml-2 text-gray-500 line-through">
                                                                ${(item.original_price || 0).toFixed(2)}
                                                            </span>
                                                            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                                                                SALE
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500">${(item.price || 0).toFixed(2)} each</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 flex items-end justify-between text-sm">
                                                <div className="flex items-center border rounded">
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                                        onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="px-3 py-1 text-gray-700">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex justify-between mt-6">
                                <button
                                    type="button"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    onClick={() => clearCart()}
                                >
                                    Clear Cart
                                </button>
                                <Link
                                    to="/shop"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </section>

                        <section
                            aria-labelledby="summary-heading"
                            className="mt-16 bg-gray-50 rounded-lg px-6 py-6 lg:p-6 lg:mt-0 lg:col-span-5"
                        >
                            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">Order summary</h2>

                            <dl className="mt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-600">Subtotal</dt>
                                    <dd className="text-sm font-medium text-gray-900">${cartTotal.toFixed(2)}</dd>
                                </div>

                                {appliedCoupon && (
                                    <div className="flex items-center justify-between text-green-700">
                                        <dt className="text-sm flex items-center">
                                            Discount ({appliedCoupon.code})
                                            <button
                                                type="button"
                                                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                                                onClick={handleRemoveCoupon}
                                            >
                                                Remove
                                            </button>
                                        </dt>
                                        <dd className="text-sm font-medium">-${discount.toFixed(2)}</dd>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-600">Shipping</dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                                    </dd>
                                </div>

                                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                                    <dt className="text-base font-medium text-gray-900">Order total</dt>
                                    <dd className="text-base font-medium text-gray-900">${orderTotal.toFixed(2)}</dd>
                                </div>
                            </dl>

                            {!appliedCoupon && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-900">Coupon code</h3>
                                    </div>

                                    <div className="mt-1 flex space-x-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Enter code"
                                            className="flex-1 min-w-0 block w-full px-3 py-2 text-base rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    {couponError && (
                                        <p className="mt-2 text-sm text-red-600">{couponError}</p>
                                    )}

                                    <p className="mt-1 text-xs text-gray-500">
                                        Try WELCOME10 for 10% off or FREESHIP for free shipping
                                    </p>
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Checkout
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage; 