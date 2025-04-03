// Checkout types for the e-commerce application

// Cart item for display in checkout
export interface CheckoutCartItem {
    id: string;
    product_id: string;
    variation_id?: string | null;
    quantity: number;
    name: string;
    price: number;
    original_price?: number; // Original price before any discounts
    image: string;
    variation_name?: string | null;
}

// Payment methods supported by the application
export type PaymentMethod = 'credit_card' | 'cash_on_delivery' | 'paypal' | 'bank_transfer';

// Payment statuses
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Credit card details
export interface CardDetails {
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
}

// Shipping address
export interface ShippingAddress {
    id: string;
    user_id: string;
    name: string;
    street: string;
    city: string;
    state: string;
    zipcode: string;
    country: string;
    is_default: boolean;
    created_at?: string;
    updated_at?: string;
}

// Order data for creating a new order
export interface NewOrderData {
    user_id: string;
    total: number;
    status: string;
    shipping_address: Partial<ShippingAddress> | null;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    delivery_date: string;
    delivery_time: string;
    gift_wrapping: boolean;
    gift_note?: string;
    special_instructions?: string;
    express_shipping: boolean;
    shipping_fee?: number;
    gift_wrapping_fee?: number;
}

// Order item data for creating order items
export interface NewOrderItem {
    order_id: string;
    product_id: string;
    product_name: string;
    variation_id?: string | null;
    variation_name?: string | null;
    quantity: number;
    price: number;
} 