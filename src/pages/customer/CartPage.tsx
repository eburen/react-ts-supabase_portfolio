import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const CartPage = () => {
    const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState<string>('');
    const [couponError, setCouponError] = useState<string | null>(null);
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
    } | null>(null);

    // Calculate cart total manually since it's not provided by the context
    const cartTotal = cartItems.reduce((total, item) => {
        // In a real app, we would use the actual price from the product data
        // For now, we'll use a placeholder price of $50 for all items
        const price = 50; // Placeholder
        return total + (price * item.quantity);
    }, 0);

    const handleQuantityChange = (id: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        updateQuantity(id, newQuantity);
    };

    const handleRemoveItem = (id: string) => {
        if (window.confirm('Are you sure you want to remove this item from your cart?')) {
            removeFromCart(id);
        }
    };

    const handleClearCart = () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            clearCart();
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        // For a real application, you would verify the coupon with Supabase
        // This is just a mockup for demonstration
        if (couponCode.toUpperCase() === 'WELCOME10') {
            setAppliedCoupon({
                code: 'WELCOME10',
                discountType: 'percentage',
                discountValue: 10
            });
            setCouponError(null);
        } else if (couponCode.toUpperCase() === 'FREESHIP') {
            setAppliedCoupon({
                code: 'FREESHIP',
                discountType: 'fixed',
                discountValue: 10
            });
            setCouponError(null);
        } else {
            setCouponError('Invalid coupon code');
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
            // Redirect to login before checkout
            if (window.confirm('Please log in to proceed to checkout. Go to login page?')) {
                navigate('/login');
            }
            return;
        }

        // Proceed to checkout
        navigate('/checkout');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Your Shopping Cart</h1>

                {cartItems.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center">
                        <p className="text-lg text-gray-600 mb-6">Your cart is empty.</p>
                        <Link to="/shop" className="bg-blue-600 text-white px-5 py-3 rounded-md font-medium hover:bg-blue-700 inline-block">
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Items */}
                        <div className="flex-1">
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <ul className="divide-y divide-gray-200">
                                    {cartItems.map((item) => (
                                        <li key={item.id} className="p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                {/* Product image */}
                                                <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                            <span className="text-gray-500 text-xs">No image</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product details */}
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                <Link to={`/product/${item.productId}`} className="hover:underline">
                                                                    {item.name}
                                                                </Link>
                                                            </h3>
                                                            {item.variationName && (
                                                                <p className="mt-1 text-sm text-gray-500">
                                                                    Variation: {item.variationName}
                                                                </p>
                                                            )}
                                                            <p className="mt-1 text-lg font-medium text-gray-900">
                                                                ${item.price.toFixed(2)}
                                                            </p>
                                                        </div>

                                                        <div className="mt-4 sm:mt-0 flex items-center">
                                                            <div className="flex items-center border rounded-md mr-4">
                                                                <button
                                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                                    className="px-3 py-1 border-r hover:bg-gray-100"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="px-4 py-1">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                                    className="px-3 py-1 border-l hover:bg-gray-100"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <button
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="mt-2 text-sm text-gray-600">
                                                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="p-4 sm:p-6 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <Link to="/shop" className="text-blue-600 hover:text-blue-800">
                                            Continue Shopping
                                        </Link>
                                        <button
                                            onClick={handleClearCart}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Clear Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="w-full lg:w-80 flex-shrink-0">
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="p-4 sm:p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>${cartTotal.toFixed(2)}</span>
                                        </div>

                                        {appliedCoupon && (
                                            <div className="flex justify-between text-green-600">
                                                <span className="flex items-center">
                                                    Discount
                                                    <button
                                                        onClick={handleRemoveCoupon}
                                                        className="ml-1 text-red-600"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </span>
                                                <span>-${discount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span>
                                                {shippingCost === 0 ? (
                                                    <span className="text-green-600">Free</span>
                                                ) : (
                                                    `$${shippingCost.toFixed(2)}`
                                                )}
                                            </span>
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-gray-200">
                                            <div className="flex justify-between font-bold text-lg">
                                                <span>Total</span>
                                                <span>${orderTotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coupon Code */}
                                    {!appliedCoupon && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Apply Coupon</h3>
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                    placeholder="Enter coupon code"
                                                    className="border flex-1 p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                            {couponError && (
                                                <p className="mt-2 text-sm text-red-600">{couponError}</p>
                                            )}
                                            <div className="mt-2 text-xs text-gray-500">
                                                Try WELCOME10 for 10% off or FREESHIP for free shipping
                                            </div>
                                        </div>
                                    )}

                                    {/* Checkout Button */}
                                    <div className="mt-6">
                                        <button
                                            onClick={handleCheckout}
                                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700"
                                        >
                                            Proceed to Checkout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage; 