import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { CheckoutCartItem } from '../types/checkout';
import { useNotification } from './NotificationContext';

// Use the CheckoutCartItem type for UI display with product details
export type CartItemWithDetails = CheckoutCartItem;

export interface CartContextType {
    cartItems: CheckoutCartItem[];
    cart: CheckoutCartItem[]; // Add cart as an alias for cartItems
    isLoading: boolean;
    addToCart: (productId: string, quantity: number, variationId?: string) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    totalItems: number;
    cartTotal: number;
    updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const fetchCart = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Join with products table to get product details
            const { data, error } = await supabase
                .from('cart_items')
                .select(`
                    *,
                    product:products(id, name, base_price, images),
                    variation:product_variations(id, name, price_adjustment)
                `)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching cart:', error);
                // If it's an RLS error, just use an empty cart
                if (error.code !== '42501') {
                    throw error;
                }
                setCartItems([]);
                return;
            }

            if (!data || data.length === 0) {
                setCartItems([]);
                return;
            }

            // Fetch active sales for all products in the cart
            const today = new Date().toISOString().split('T')[0];
            const productIds = data.map(item => item.product_id);

            const { data: salesData } = await supabase
                .from('product_sales')
                .select('*')
                .in('product_id', productIds)
                .eq('active', true)
                .lte('start_date', today)
                .gte('end_date', today);

            const activeSales = salesData || [];

            // Transform the data to include product details and apply sales
            const cartItemsWithDetails = data.map((item: {
                id: string;
                product_id: string;
                variation_id: string | null;
                quantity: number;
                product?: {
                    id: string;
                    name: string;
                    base_price: number;
                    images: string[] | null;
                };
                variation?: {
                    id: string;
                    name: string;
                    price_adjustment: number;
                };
            }) => {
                // Calculate base price (product base + variation adjustment)
                const basePrice = (item.product?.base_price || 0) +
                    (item.variation?.price_adjustment || 0);

                // Find applicable sale
                const sale = activeSales.find(s =>
                    s.product_id === item.product_id &&
                    ((item.variation_id && s.variation_id === item.variation_id) ||
                        (!item.variation_id && !s.variation_id))
                );

                // Apply discount if a sale exists
                let finalPrice = basePrice;
                if (sale && sale.discount_percentage) {
                    finalPrice = basePrice * (1 - (sale.discount_percentage / 100));
                }

                return {
                    id: item.id,
                    product_id: item.product_id,
                    variation_id: item.variation_id,
                    quantity: item.quantity,
                    // Add product details
                    name: item.product?.name || 'Product',
                    price: finalPrice, // Apply sale discount if applicable
                    original_price: sale ? basePrice : undefined, // Store original price if on sale
                    image: item.product?.images?.[0] || '/images/placeholder.jpg',
                    variation_name: item.variation?.name || null
                };
            });

            setCartItems(cartItemsWithDetails);
        } catch (error) {
            console.error('Error fetching cart:', error);
            setCartItems([]); // Set empty cart on error
        } finally {
            setIsLoading(false);
        }
    }, [user]);

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
    }, [user, fetchCart]);

    // Save cart to localStorage when it changes (for anonymous users)
    useEffect(() => {
        if (!user && cartItems.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
        }
    }, [cartItems, user]);

    const addToCart = async (productId: string, quantity: number, variationId?: string) => {
        setIsLoading(true);

        try {
            // First, fetch the product details
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('id, name, base_price, images')
                .eq('id', productId)
                .single();

            if (productError) {
                console.error('Error fetching product details:', productError);
                throw productError;
            }

            // Fetch variation details if a variation is selected
            let variationData = null;
            if (variationId) {
                const { data, error } = await supabase
                    .from('product_variations')
                    .select('id, name, price_adjustment')
                    .eq('id', variationId)
                    .single();

                if (!error) {
                    variationData = data;
                }
            }

            // Fetch active sale for the product or variation
            const today = new Date().toISOString().split('T')[0];

            const saleQuery = supabase
                .from('product_sales')
                .select('*')
                .eq('product_id', productId)
                .eq('active', true)
                .lte('start_date', today)
                .gte('end_date', today);

            if (variationId) {
                saleQuery.eq('variation_id', variationId);
            } else {
                saleQuery.is('variation_id', null);
            }

            const { data: saleData } = await saleQuery.maybeSingle();

            // Calculate the base price (base price + variation adjustment if any)
            const basePrice = productData.base_price + (variationData?.price_adjustment || 0);

            // Apply discount if there's an active sale
            let finalPrice = basePrice;
            if (saleData && saleData.discount_percentage) {
                finalPrice = basePrice * (1 - (saleData.discount_percentage / 100));
            }

            // Check if the same product (and variation if applicable) already exists in the cart
            const existingItemIndex = cartItems.findIndex(
                item => item.product_id === productId &&
                    ((!variationId && !item.variation_id) || item.variation_id === variationId)
            );

            // If the product already exists in the cart, update its quantity instead of adding a new item
            if (existingItemIndex !== -1) {
                const existingItem = cartItems[existingItemIndex];
                const newQuantity = existingItem.quantity + quantity;

                if (user) {
                    // For logged in users, update the database
                    const { error } = await supabase
                        .from('cart_items')
                        .update({ quantity: newQuantity })
                        .eq('id', existingItem.id);

                    if (error) {
                        console.error('Error updating cart quantity:', error);
                        if (error.code !== '42501') {
                            throw error;
                        }
                    }
                }

                // Update local state with the new price (keeping the sale price if it exists)
                const updatedCartItems = [...cartItems];
                updatedCartItems[existingItemIndex] = {
                    ...existingItem,
                    quantity: newQuantity,
                    price: finalPrice, // Update the price in case the sale has changed
                    original_price: saleData ? basePrice : undefined // Store original price if on sale
                };

                setCartItems(updatedCartItems);

                // Show updated notification
                const itemName = variationData
                    ? `${productData.name} (${variationData.name})`
                    : productData.name;
                showNotification(`Updated: ${itemName} (${newQuantity} in cart)`, 'success');

                setIsLoading(false);
                return;
            }

            // If the product is not already in the cart, add it as a new item
            if (user) {
                // For logged in users, add to database
                const { data, error } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id: user.id,
                        product_id: productId,
                        variation_id: variationId || null,
                        quantity
                    })
                    .select('*')
                    .single();

                if (error) {
                    console.error('Error adding to cart:', error);
                    if (error.code !== '42501') {
                        throw error;
                    }
                }

                // Add product details to the cart item
                const newItem: CartItemWithDetails = {
                    ...data,
                    name: productData.name,
                    price: finalPrice, // Use the sale price if applicable
                    original_price: saleData ? basePrice : undefined, // Store original price if on sale
                    image: productData.images?.[0] || '/images/placeholder.jpg',
                    variation_name: variationData?.name || null
                };

                setCartItems(prev => [...prev, newItem]);

                // Show success notification
                const itemName = variationData
                    ? `${productData.name} (${variationData.name})`
                    : productData.name;
                showNotification(`Added to cart: ${itemName}`, 'success');
            } else {
                // For anonymous users, save to state/localStorage with product details
                const newItem: CartItemWithDetails = {
                    id: Date.now().toString(), // Temporary ID
                    product_id: productId,
                    variation_id: variationId,
                    quantity,
                    // Add product details
                    name: productData.name,
                    price: finalPrice, // Use the sale price if applicable
                    original_price: saleData ? basePrice : undefined, // Store original price if on sale
                    image: productData.images?.[0] || '/images/placeholder.jpg',
                    variation_name: variationData?.name || null
                };

                setCartItems(prev => [...prev, newItem]);

                // Show success notification
                const itemName = variationData
                    ? `${productData.name} (${variationData.name})`
                    : productData.name;
                showNotification(`Added to cart: ${itemName}`, 'success');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Failed to add item to cart', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromCart = async (itemId: string) => {
        setIsLoading(true);

        try {
            // Find the item before removing it so we can show a notification
            const itemToRemove = cartItems.find(item => item.id === itemId);

            if (user) {
                // For logged in users, remove from database
                const { error } = await supabase
                    .from('cart_items')
                    .delete()
                    .eq('id', itemId);

                if (error) {
                    console.error('Error removing from cart:', error);
                    // If it's an RLS error, just update the local state anyway
                    if (error.code !== '42501') {
                        throw error;
                    }
                }
            }

            // Update local state
            setCartItems(prev => prev.filter(item => item.id !== itemId));

            // Show notification if we found the item
            if (itemToRemove) {
                const itemName = itemToRemove.variation_name
                    ? `${itemToRemove.name} (${itemToRemove.variation_name})`
                    : itemToRemove.name;
                showNotification(`Removed from cart: ${itemName}`, 'info');
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            showNotification('Failed to remove item from cart', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        setIsLoading(true);

        try {
            if (user) {
                // For logged in users, update in database
                const { error } = await supabase
                    .from('cart_items')
                    .update({ quantity })
                    .eq('id', itemId);

                if (error) {
                    console.error('Error updating cart quantity:', error);
                    if (error.code !== '42501') {
                        throw error;
                    }
                }
            }

            // Update local state
            const updatedItems = cartItems.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, quantity };

                    // Show update notification
                    const itemName = item.variation_name
                        ? `${item.name} (${item.variation_name})`
                        : item.name;
                    showNotification(`Updated: ${itemName} (${quantity} in cart)`, 'info');

                    return updatedItem;
                }
                return item;
            });

            setCartItems(updatedItems);
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            showNotification('Failed to update item quantity', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const clearCart = async () => {
        setIsLoading(true);

        try {
            if (user) {
                // For logged in users, clear cart in database
                const { error } = await supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error clearing cart:', error);
                    if (error.code !== '42501') {
                        throw error;
                    }
                }
            }

            // Clear local state
            setCartItems([]);

            // Show notification
            showNotification('Cart cleared successfully', 'info');
        } catch (error) {
            console.error('Error clearing cart:', error);
            showNotification('Failed to clear cart', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate total items in cart
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

    // Calculate cart total
    const cartTotal = cartItems.reduce((total, item) => {
        const price = item.price || 0;
        return total + (price * item.quantity);
    }, 0);

    // Alias for updateQuantity to match the CartPage interface
    const updateCartItemQuantity = updateQuantity;

    const value = {
        cartItems,
        cart: cartItems,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        cartTotal,
        updateCartItemQuantity
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        console.error('useCart must be used within a CartProvider');
        // Return a default implementation to prevent app crashes
        return {
            cartItems: [],
            cart: [],
            isLoading: false,
            addToCart: async () => { },
            removeFromCart: async () => { },
            updateQuantity: async () => { },
            clearCart: async () => { },
            totalItems: 0,
            cartTotal: 0,
            updateCartItemQuantity: async () => { }
        };
    }
    return context;
} 