import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { CartItem, Product, ProductVariation } from '../types';

interface CartContextType {
    cartItems: CartItem[];
    isLoading: boolean;
    addToCart: (productId: string, quantity: number, variationId?: string) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    totalItems: number;
    subTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            // Load cart from local storage for anonymous users
            const storedCart = localStorage.getItem('cart');
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
            setIsLoading(false);
        }
    }, [user]);

    // Save cart to localStorage when it changes (for anonymous users)
    useEffect(() => {
        if (!user && cartItems.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
        }
    }, [cartItems, user]);

    const fetchCart = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            setCartItems(data as CartItem[]);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = async (productId: string, quantity: number, variationId?: string) => {
        setIsLoading(true);

        try {
            if (user) {
                // For logged in users, save to database
                const { data, error } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id: user.id,
                        product_id: productId,
                        variation_id: variationId || null,
                        quantity
                    })
                    .select()
                    .single();

                if (error) throw error;

                setCartItems(prev => [...prev, data as CartItem]);
            } else {
                // For anonymous users, save to state/localStorage
                const newItem: CartItem = {
                    id: Date.now().toString(), // Temporary ID
                    product_id: productId,
                    variation_id: variationId,
                    quantity
                };

                setCartItems(prev => [...prev, newItem]);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromCart = async (itemId: string) => {
        setIsLoading(true);

        try {
            if (user) {
                // For logged in users, remove from database
                const { error } = await supabase
                    .from('cart_items')
                    .delete()
                    .eq('id', itemId);

                if (error) throw error;
            }

            // Update local state
            setCartItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Error removing from cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        if (quantity < 1) {
            return removeFromCart(itemId);
        }

        setIsLoading(true);

        try {
            if (user) {
                // For logged in users, update in database
                const { error } = await supabase
                    .from('cart_items')
                    .update({ quantity })
                    .eq('id', itemId);

                if (error) throw error;
            }

            // Update local state
            setCartItems(prev =>
                prev.map(item =>
                    item.id === itemId ? { ...item, quantity } : item
                )
            );
        } catch (error) {
            console.error('Error updating cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearCart = async () => {
        setIsLoading(true);

        try {
            if (user) {
                // For logged in users, clear from database
                const { error } = await supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', user.id);

                if (error) throw error;
            }

            // Clear local state
            setCartItems([]);

            // Clear localStorage for anonymous users
            if (!user) {
                localStorage.removeItem('cart');
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate total items in cart
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

    // We'll calculate subtotal in a real app by fetching product prices
    // This is a placeholder implementation
    const subTotal = 0;

    const value = {
        cartItems,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subTotal
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
} 