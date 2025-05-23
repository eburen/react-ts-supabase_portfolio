// User Types
export type UserRole = 'admin' | 'customer';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface User {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    created_at: string;
    birthday?: string;
    gender?: Gender;
    phone_number?: string;
}

// Product Types
export type ProductVariationType = 'size' | 'color' | 'bundle';

export interface ProductVariation {
    id: string;
    product_id: string;
    type: ProductVariationType;
    name: string;
    price_adjustment: number;
    stock: number;
    sale?: Sale;
}

export interface Sale {
    id: string;
    product_id: string;
    variation_id?: string | null;
    discount_percentage: number;
    start_date: string;
    end_date: string;
    active: boolean;
    created_at?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    base_price: number;
    images: string[];
    category: string;
    created_at: string;
    updated_at: string;
    variations?: ProductVariation[];
    average_rating?: number;
    sale?: Sale;
}

// Order Types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'completed';
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed';
export type PaymentMethod = 'credit_card' | 'cash_on_delivery' | 'paypal' | 'bank_transfer';

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    variation_id?: string;
    variation_name?: string;
    quantity: number;
    price: number;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    user_id: string;
    status: OrderStatus;
    total: number;
    order_items: OrderItem[];
    coupon_id?: string;
    discount_amount?: number;
    created_at: string;
    updated_at: string;
    shipping_address?: ShippingAddress;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod;
    delivery_date?: string;
    delivery_time?: string;
    gift_wrapping: boolean;
    gift_note?: string;
    special_instructions?: string;
    express_shipping: boolean;
    shipping_fee?: number;
    gift_wrapping_fee?: number;
}

// Review Types
export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    username?: string;
    rating: number;
    text: string;
    comment?: string;
    created_at: string;
}

// Coupon Types
export interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    minimum_purchase?: number;
    expiry_date?: string;
    is_active: boolean;
    created_at: string;
}

// Cart & Wishlist Types
export interface CartItem {
    id: string;
    product_id: string;
    variation_id?: string;
    quantity: number;
}

export interface Cart {
    id: string;
    user_id: string;
    items: CartItem[];
    created_at: string;
    updated_at: string;
}

export interface WishlistItem {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
}

// Address Types
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
}

// Analytics Types
export interface SalesData {
    date: string;
    total_sales: number;
    order_count: number;
} 