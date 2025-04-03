import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { CreditCardIcon, TruckIcon, GiftIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { ShippingAddress, CardDetails, PaymentMethod, CheckoutCartItem } from '../../types/checkout';
import CouponApplier from '../../components/checkout/CouponApplier';
import '../../styles/Checkout.css';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cart = [], clearCart } = useCart() || { cart: [], clearCart: async () => { } };

    // State for checkout data
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
    const [cardDetails, setCardDetails] = useState<CardDetails>({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: ''
    });
    const [deliveryDate, setDeliveryDate] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('');
    const [isGiftWrapping, setIsGiftWrapping] = useState(false);
    const [giftNote, setGiftNote] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [expressShipping, setExpressShipping] = useState(false);
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [couponDiscount, setCouponDiscount] = useState<number>(0);

    // State for UI
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Calculate dates for delivery options (exclude weekends and today)
    const getAvailableDeliveryDates = () => {
        const dates = [];
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 14); // Next 2 weeks

        for (let date = new Date(today); date <= futureDate; date.setDate(date.getDate() + 1)) {
            // Skip today and add 1 day buffer for processing
            if (date.getDate() > today.getDate() + 1) {
                // Skip weekends (0 = Sunday, 6 = Saturday)
                if (date.getDay() !== 0 && date.getDay() !== 6) {
                    const formattedDate = date.toISOString().split('T')[0];
                    dates.push(formattedDate);
                }
            }
        }

        return dates;
    };

    // Calculate times based on selected date
    const getAvailableDeliveryTimes = () => {
        const times = ['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'];

        // If today is selected, filter out past time slots
        if (deliveryDate === new Date().toISOString().split('T')[0]) {
            const currentHour = new Date().getHours();
            return times.filter(time => {
                const startHour = parseInt(time.split(':')[0]);
                return startHour > currentHour;
            });
        }

        return times;
    };

    // Shipping fee calculation
    const calculateShippingFee = () => {
        if (expressShipping) {
            return 15.99;
        }
        // Free shipping for orders over $100
        return getSubtotal() > 100 ? 0 : 7.99;
    };

    // Gift wrapping fee
    const getGiftWrappingFee = () => {
        return isGiftWrapping ? 5.99 : 0;
    };

    // Calculate subtotal from cart items
    const getSubtotal = () => {
        return cart && cart.length > 0
            ? cart.reduce((total: number, item: CheckoutCartItem) => total + (item.price * item.quantity), 0)
            : 0;
    };

    // Calculate total
    const getTotal = () => {
        if (!cart || cart.length === 0) return 0;
        return getSubtotal() + calculateShippingFee() + getGiftWrappingFee() - couponDiscount;
    };

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        // Check if we came from the cart page with a valid checkout flag
        const validCheckout = localStorage.getItem('validCheckout') === 'true';

        // Only redirect if we don't have a valid checkout flag and the cart is empty
        if (!validCheckout && (!cart || cart.length === 0)) {
            navigate('/cart');
            return;
        }

        // Remove the flag after we've used it
        localStorage.removeItem('validCheckout');

        const fetchAddresses = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('shipping_addresses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('is_default', { ascending: false });

                if (error) throw error;

                setAddresses(data || []);
                // Select default address if available
                const defaultAddress = data?.find(addr => addr.is_default);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                } else if (data && data.length > 0) {
                    setSelectedAddressId(data[0].id);
                }
            } catch (error) {
                console.error('Error fetching addresses:', error);
                setError('Failed to load addresses. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchAddresses();

        // Set default delivery date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        setDeliveryDate(tomorrow.toISOString().split('T')[0]);

        // Set default delivery time
        setDeliveryTime('09:00-12:00');

        // Cleanup function to remove the flag when component unmounts
        return () => {
            localStorage.removeItem('validCheckout');
        };

    }, [user, navigate, cart]);

    const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Format card number with spaces
        if (name === 'cardNumber') {
            const formattedValue = value
                .replace(/\s/g, '') // Remove existing spaces
                .replace(/\D/g, '') // Remove non-digits
                .slice(0, 16); // Limit to 16 digits

            // Add spaces after every 4 digits
            const parts = [];
            for (let i = 0; i < formattedValue.length; i += 4) {
                parts.push(formattedValue.slice(i, i + 4));
            }

            setCardDetails({
                ...cardDetails,
                cardNumber: parts.join(' ').trim()
            });
            return;
        }

        // Format expiry date as MM/YY
        if (name === 'expiryDate') {
            const digits = value.replace(/\D/g, '').slice(0, 4);
            if (digits.length <= 2) {
                setCardDetails({
                    ...cardDetails,
                    expiryDate: digits
                });
            } else {
                setCardDetails({
                    ...cardDetails,
                    expiryDate: `${digits.slice(0, 2)}/${digits.slice(2)}`
                });
            }
            return;
        }

        // Format CVV (numbers only, max 4 digits)
        if (name === 'cvv') {
            setCardDetails({
                ...cardDetails,
                cvv: value.replace(/\D/g, '').slice(0, 4)
            });
            return;
        }

        setCardDetails({
            ...cardDetails,
            [name]: value
        });
    };

    const validateForm = () => {
        if (!selectedAddressId) {
            setError('Please select a shipping address');
            return false;
        }

        if (paymentMethod === 'credit_card') {
            if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
                setError('Please enter a valid card number');
                return false;
            }

            if (!cardDetails.cardName) {
                setError('Please enter the cardholder name');
                return false;
            }

            if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
                setError('Please enter a valid expiry date');
                return false;
            }

            if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
                setError('Please enter a valid CVV code');
                return false;
            }
        }

        if (!deliveryDate) {
            setError('Please select a delivery date');
            return false;
        }

        if (!deliveryTime) {
            setError('Please select a delivery time');
            return false;
        }

        return true;
    };

    const handleCouponApplied = (discount: number, code: string) => {
        setCouponDiscount(discount);
        setAppliedCouponCode(code);
    };

    const handleCouponRemoved = () => {
        setCouponDiscount(0);
        setAppliedCouponCode(null);
    };

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            // Get the selected address
            const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

            // Create the order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user?.id,
                    total: getTotal(),
                    status: 'pending',
                    shipping_address: selectedAddress ? {
                        name: selectedAddress.name,
                        street: selectedAddress.street,
                        city: selectedAddress.city,
                        state: selectedAddress.state,
                        zipcode: selectedAddress.zipcode,
                        country: selectedAddress.country
                    } : null,
                    payment_method: paymentMethod,
                    payment_status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
                    delivery_date: deliveryDate,
                    delivery_time: deliveryTime,
                    gift_wrapping: isGiftWrapping,
                    gift_note: giftNote,
                    special_instructions: specialInstructions,
                    express_shipping: expressShipping,
                    shipping_fee: calculateShippingFee(),
                    gift_wrapping_fee: getGiftWrappingFee(),
                    coupon_code: appliedCouponCode,
                    coupon_discount: couponDiscount
                })
                .select();

            if (orderError) throw orderError;

            if (!orderData || orderData.length === 0) {
                throw new Error('Failed to create order');
            }

            const orderId = orderData[0].id;

            // Create order items
            const orderItems = cart && cart.length > 0 ? cart.map((item: CheckoutCartItem) => ({
                order_id: orderId,
                product_id: item.product_id,
                product_name: item.name,
                variation_id: item.variation_id || null,
                variation_name: item.variation_name || null,
                quantity: item.quantity,
                price: item.price
            })) : [];

            if (orderItems.length > 0) {
                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems);

                if (itemsError) throw itemsError;
            }

            // Clear the cart
            await clearCart();

            setSuccess('Order placed successfully!');

            // Ensure the validCheckout flag is cleared
            localStorage.removeItem('validCheckout');

            // Redirect to order confirmation page
            setTimeout(() => {
                navigate(`/order-confirmation/${orderId}`);
            }, 2000);

        } catch (error) {
            console.error('Error submitting order:', error);
            setError('Failed to submit order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="checkout-container">
                    <h1 className="checkout-title">Checkout</h1>

                    {error && (
                        <div className="checkout-error" role="alert">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="checkout-success" role="alert">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmitOrder} className="checkout-form">
                        <div className="checkout-grid">
                            <div className="checkout-grid-left">
                                {/* Shipping Address Section */}
                                <section className="checkout-section">
                                    <h2 className="checkout-section-title">
                                        <TruckIcon className="h-5 w-5 mr-2" />
                                        Shipping Address
                                    </h2>

                                    {addresses.length === 0 ? (
                                        <div className="checkout-empty-state">
                                            <p>You don't have any saved addresses.</p>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/account/addresses/new')}
                                                className="checkout-button-secondary mt-2"
                                            >
                                                Add New Address
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {addresses.map(address => (
                                                <div
                                                    key={address.id}
                                                    className={`checkout-address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                                                    onClick={() => setSelectedAddressId(address.id)}
                                                >
                                                    <div className="flex items-start">
                                                        <input
                                                            type="radio"
                                                            name="shippingAddress"
                                                            id={`address-${address.id}`}
                                                            className="checkout-radio"
                                                            checked={selectedAddressId === address.id}
                                                            onChange={() => setSelectedAddressId(address.id)}
                                                        />
                                                        <div className="ml-3">
                                                            <label htmlFor={`address-${address.id}`} className="text-sm font-medium text-gray-900">
                                                                {address.name} {address.is_default && <span className="text-xs text-blue-600">(Default)</span>}
                                                            </label>
                                                            <p className="text-sm text-gray-500 mt-1">{address.street}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {address.city}, {address.state} {address.zipcode}
                                                            </p>
                                                            <p className="text-sm text-gray-500">{address.country}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => navigate('/account/addresses/new')}
                                                className="checkout-button-link mt-2"
                                            >
                                                + Add New Address
                                            </button>
                                        </div>
                                    )}
                                </section>

                                {/* Payment Method Section */}
                                <section className="checkout-section">
                                    <h2 className="checkout-section-title">
                                        <CreditCardIcon className="h-5 w-5 mr-2" />
                                        Payment Method
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="checkout-payment-option">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                id="credit-card"
                                                value="credit_card"
                                                className="checkout-radio"
                                                checked={paymentMethod === 'credit_card'}
                                                onChange={() => setPaymentMethod('credit_card')}
                                            />
                                            <label htmlFor="credit-card" className="ml-3 block text-sm font-medium text-gray-700">
                                                Credit / Debit Card
                                            </label>
                                        </div>

                                        {paymentMethod === 'credit_card' && (
                                            <div className="checkout-card-details">
                                                <div className="checkout-form-group">
                                                    <label htmlFor="cardNumber" className="checkout-form-label">
                                                        Card Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="cardNumber"
                                                        name="cardNumber"
                                                        placeholder="1234 5678 9012 3456"
                                                        value={cardDetails.cardNumber}
                                                        onChange={handleCardDetailsChange}
                                                        className="checkout-form-input"
                                                        required={paymentMethod === 'credit_card'}
                                                    />
                                                </div>

                                                <div className="checkout-form-group">
                                                    <label htmlFor="cardName" className="checkout-form-label">
                                                        Cardholder Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="cardName"
                                                        name="cardName"
                                                        placeholder="John Doe"
                                                        value={cardDetails.cardName}
                                                        onChange={handleCardDetailsChange}
                                                        className="checkout-form-input"
                                                        required={paymentMethod === 'credit_card'}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="checkout-form-group">
                                                        <label htmlFor="expiryDate" className="checkout-form-label">
                                                            Expiry Date (MM/YY)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="expiryDate"
                                                            name="expiryDate"
                                                            placeholder="MM/YY"
                                                            value={cardDetails.expiryDate}
                                                            onChange={handleCardDetailsChange}
                                                            className="checkout-form-input"
                                                            required={paymentMethod === 'credit_card'}
                                                        />
                                                    </div>

                                                    <div className="checkout-form-group">
                                                        <label htmlFor="cvv" className="checkout-form-label">
                                                            CVV
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="cvv"
                                                            name="cvv"
                                                            placeholder="123"
                                                            value={cardDetails.cvv}
                                                            onChange={handleCardDetailsChange}
                                                            className="checkout-form-input"
                                                            required={paymentMethod === 'credit_card'}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="checkout-payment-option">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                id="cash-on-delivery"
                                                value="cash_on_delivery"
                                                className="checkout-radio"
                                                checked={paymentMethod === 'cash_on_delivery'}
                                                onChange={() => setPaymentMethod('cash_on_delivery')}
                                            />
                                            <label htmlFor="cash-on-delivery" className="ml-3 block text-sm font-medium text-gray-700">
                                                Cash on Delivery
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                {/* Delivery Options Section */}
                                <section className="checkout-section">
                                    <h2 className="checkout-section-title">
                                        <CalendarIcon className="h-5 w-5 mr-2" />
                                        Delivery Options
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="checkout-form-group">
                                            <label htmlFor="deliveryDate" className="checkout-form-label">
                                                Delivery Date
                                            </label>
                                            <select
                                                id="deliveryDate"
                                                name="deliveryDate"
                                                value={deliveryDate}
                                                onChange={(e) => setDeliveryDate(e.target.value)}
                                                className="checkout-form-select"
                                                required
                                            >
                                                <option value="">Select a date</option>
                                                {getAvailableDeliveryDates().map(date => (
                                                    <option key={date} value={date}>
                                                        {new Date(date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="checkout-form-group">
                                            <label htmlFor="deliveryTime" className="checkout-form-label">
                                                Delivery Time
                                            </label>
                                            <select
                                                id="deliveryTime"
                                                name="deliveryTime"
                                                value={deliveryTime}
                                                onChange={(e) => setDeliveryTime(e.target.value)}
                                                className="checkout-form-select"
                                                required
                                            >
                                                <option value="">Select a time</option>
                                                {getAvailableDeliveryTimes().map(time => (
                                                    <option key={time} value={time}>
                                                        {time}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="checkout-option-card">
                                            <div className="flex items-start">
                                                <input
                                                    type="checkbox"
                                                    id="expressShipping"
                                                    name="expressShipping"
                                                    checked={expressShipping}
                                                    onChange={(e) => setExpressShipping(e.target.checked)}
                                                    className="checkout-checkbox"
                                                />
                                                <div className="ml-3">
                                                    <label htmlFor="expressShipping" className="text-sm font-medium text-gray-900">
                                                        Express Shipping (+$15.99)
                                                    </label>
                                                    <p className="text-sm text-gray-500">
                                                        Get your order delivered with priority handling and faster shipping.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Gift Options Section */}
                                <section className="checkout-section">
                                    <h2 className="checkout-section-title">
                                        <GiftIcon className="h-5 w-5 mr-2" />
                                        Gift Options
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="checkout-option-card">
                                            <div className="flex items-start">
                                                <input
                                                    type="checkbox"
                                                    id="giftWrapping"
                                                    name="giftWrapping"
                                                    checked={isGiftWrapping}
                                                    onChange={(e) => setIsGiftWrapping(e.target.checked)}
                                                    className="checkout-checkbox"
                                                />
                                                <div className="ml-3">
                                                    <label htmlFor="giftWrapping" className="text-sm font-medium text-gray-900">
                                                        Gift Wrapping (+$5.99)
                                                    </label>
                                                    <p className="text-sm text-gray-500">
                                                        Have your items beautifully wrapped with premium paper and a decorative ribbon.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {isGiftWrapping && (
                                            <div className="checkout-form-group">
                                                <label htmlFor="giftNote" className="checkout-form-label">
                                                    Gift Message
                                                </label>
                                                <textarea
                                                    id="giftNote"
                                                    name="giftNote"
                                                    value={giftNote}
                                                    onChange={(e) => setGiftNote(e.target.value)}
                                                    placeholder="Add a personal message to your gift (optional)"
                                                    className="checkout-form-textarea"
                                                    maxLength={200}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {giftNote.length}/200 characters
                                                </p>
                                            </div>
                                        )}

                                        <div className="checkout-form-group">
                                            <label htmlFor="specialInstructions" className="checkout-form-label">
                                                Special Instructions (Optional)
                                            </label>
                                            <textarea
                                                id="specialInstructions"
                                                name="specialInstructions"
                                                value={specialInstructions}
                                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                                placeholder="Add any special delivery instructions or other requests"
                                                className="checkout-form-textarea"
                                                maxLength={300}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {specialInstructions.length}/300 characters
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="checkout-grid-right">
                                {/* Order Summary Section */}
                                <section className="checkout-order-summary">
                                    <h2 className="checkout-section-title mb-4">Order Summary</h2>

                                    <div className="checkout-order-items">
                                        {cart && cart.map((item: CheckoutCartItem) => (
                                            <div key={item.id} className="checkout-order-item">
                                                <div className="checkout-order-item-image">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-16 w-16 rounded object-cover"
                                                    />
                                                    <span className="checkout-order-item-quantity">{item.quantity}</span>
                                                </div>
                                                <div className="checkout-order-item-details">
                                                    <h3 className="checkout-order-item-title">
                                                        {item.name}
                                                        {item.variation_name && <span className="text-sm text-gray-500"> ({item.variation_name})</span>}
                                                    </h3>

                                                    {/* Product price with sale information */}
                                                    {item.original_price && item.original_price > item.price ? (
                                                        <div className="flex items-center">
                                                            <span className="text-red-600 font-medium">
                                                                ${item.price.toFixed(2)}
                                                            </span>
                                                            <span className="ml-2 text-gray-500 line-through text-sm">
                                                                ${item.original_price.toFixed(2)}
                                                            </span>
                                                            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                                                                SALE
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <p className="checkout-order-item-price">${item.price.toFixed(2)}</p>
                                                    )}
                                                </div>
                                                <div className="checkout-order-item-total">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <CouponApplier
                                        subTotal={getSubtotal()}
                                        onApplied={handleCouponApplied}
                                        onRemove={handleCouponRemoved}
                                        appliedCouponCode={appliedCouponCode || undefined}
                                        appliedDiscount={couponDiscount}
                                    />

                                    <div className="checkout-order-totals">
                                        <div className="checkout-order-subtotal">
                                            <span>Subtotal</span>
                                            <span>${getSubtotal().toFixed(2)}</span>
                                        </div>

                                        <div className="checkout-order-shipping">
                                            <span>Shipping</span>
                                            <span>${calculateShippingFee().toFixed(2)}</span>
                                        </div>

                                        {isGiftWrapping && (
                                            <div className="checkout-order-gift-wrapping">
                                                <span>Gift Wrapping</span>
                                                <span>${getGiftWrappingFee().toFixed(2)}</span>
                                            </div>
                                        )}

                                        {couponDiscount > 0 && (
                                            <div className="checkout-order-discount">
                                                <span>Discount</span>
                                                <span>-${couponDiscount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="checkout-order-total">
                                            <span>Total</span>
                                            <span>${getTotal().toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || addresses.length === 0}
                                        className="checkout-button-primary w-full mt-6"
                                    >
                                        {submitting ? 'Processing...' : `Place Order • $${getTotal().toFixed(2)}`}
                                    </button>

                                    <p className="text-xs text-gray-500 mt-4 text-center">
                                        By placing your order, you agree to our Terms of Service and Privacy Policy.
                                    </p>
                                </section>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;