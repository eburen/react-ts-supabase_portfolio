import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { WishlistItem } from '../types';
import { useNotification } from './NotificationContext';

export interface WishlistItemWithDetails extends WishlistItem {
    name: string;
    price: number;
    image: string;
    original_price?: number;
}

export interface WishlistContextType {
    wishlistItems: WishlistItemWithDetails[];
    isLoading: boolean;
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (itemId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlistItems, setWishlistItems] = useState<WishlistItemWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const fetchWishlist = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Join with products table to get product details
            const { data, error } = await supabase
                .from('wishlist_items')
                .select(`
          *,
          product:products(id, name, base_price, images)
        `)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching wishlist:', error);
                if (error.code !== '42501') {
                    throw error;
                }
                setWishlistItems([]);
                return;
            }

            if (!data || data.length === 0) {
                setWishlistItems([]);
                return;
            }

            // Fetch active sales for all products in the wishlist
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

            // Transform the data to include product details
            const wishlistItemsWithDetails = data.map((item: {
                id: string;
                user_id: string;
                product_id: string;
                created_at: string;
                product?: {
                    id: string;
                    name: string;
                    base_price: number;
                    images?: string[];
                };
            }) => {
                // Calculate base price
                const basePrice = item.product?.base_price || 0;

                // Find applicable sale
                const sale = activeSales.find(s =>
                    s.product_id === item.product_id && !s.variation_id
                );

                // Apply discount if a sale exists
                let finalPrice = basePrice;
                if (sale && sale.discount_percentage) {
                    finalPrice = basePrice * (1 - (sale.discount_percentage / 100));
                }

                return {
                    id: item.id,
                    user_id: item.user_id,
                    product_id: item.product_id,
                    created_at: item.created_at,
                    // Add product details
                    name: item.product?.name || 'Product',
                    price: finalPrice, // Apply sale discount if applicable
                    original_price: sale ? basePrice : undefined, // Store original price if on sale
                    image: item.product?.images?.[0] || '/images/placeholder.jpg'
                };
            });

            setWishlistItems(wishlistItemsWithDetails);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            setWishlistItems([]); // Set empty wishlist on error
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            // Load wishlist from local storage for anonymous users
            const storedWishlist = localStorage.getItem('wishlist');
            if (storedWishlist) {
                setWishlistItems(JSON.parse(storedWishlist));
            }
            setIsLoading(false);
        }
    }, [user, fetchWishlist]);

    // Save wishlist to localStorage when it changes (for anonymous users)
    useEffect(() => {
        if (!user && wishlistItems.length > 0) {
            localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
        }
    }, [wishlistItems, user]);

    const isInWishlist = useCallback((productId: string) => {
        return wishlistItems.some(item => item.product_id === productId);
    }, [wishlistItems]);

    const addToWishlist = async (productId: string) => {
        setIsLoading(true);

        try {
            // Check if the product is already in the wishlist
            if (isInWishlist(productId)) {
                showNotification('This product is already in your favorites', 'info');
                setIsLoading(false);
                return;
            }

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

            // Fetch active sale for the product
            const today = new Date().toISOString().split('T')[0];

            const { data: saleData } = await supabase
                .from('product_sales')
                .select('*')
                .eq('product_id', productId)
                .eq('active', true)
                .lte('start_date', today)
                .gte('end_date', today)
                .is('variation_id', null)
                .maybeSingle();

            // Calculate the price
            const basePrice = productData.base_price;

            // Apply discount if there's an active sale
            let finalPrice = basePrice;
            if (saleData && saleData.discount_percentage) {
                finalPrice = basePrice * (1 - (saleData.discount_percentage / 100));
            }

            // Create a new wishlist item with product details
            const newItem: WishlistItemWithDetails = {
                id: Date.now().toString(), // Temporary ID
                user_id: user ? user.id : 'anonymous',
                product_id: productId,
                created_at: new Date().toISOString(),
                // Add product details
                name: productData.name,
                price: finalPrice, // Use the sale price if applicable
                original_price: saleData ? basePrice : undefined, // Store original price if on sale
                image: productData.images?.[0] || '/images/placeholder.jpg'
            };

            if (user) {
                // For logged in users, try to add to database
                try {
                    const { data, error } = await supabase
                        .from('wishlist_items')
                        .insert({
                            user_id: user.id,
                            product_id: productId
                        })
                        .select('*')
                        .single();

                    if (error) {
                        console.error('Error adding to wishlist:', error);
                        if (error.code === '42501') {
                            // RLS policy violation, fall back to local storage
                            setWishlistItems(prev => [...prev, newItem]);
                            localStorage.setItem('wishlist', JSON.stringify([...wishlistItems, newItem]));
                        } else {
                            throw error;
                        }
                    } else {
                        // Update the ID with the database ID
                        newItem.id = data.id;
                        setWishlistItems(prev => [...prev, newItem]);
                    }
                } catch (insertError) {
                    console.error('Error adding to wishlist:', insertError);
                    // Fall back to local storage
                    setWishlistItems(prev => [...prev, newItem]);
                    localStorage.setItem('wishlist', JSON.stringify([...wishlistItems, newItem]));
                }
            } else {
                // For anonymous users, save to state/localStorage with product details
                setWishlistItems(prev => [...prev, newItem]);
                localStorage.setItem('wishlist', JSON.stringify([...wishlistItems, newItem]));
            }

            showNotification(`Added to favorites: ${productData.name}`, 'success');
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            showNotification('Failed to add item to favorites', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromWishlist = async (itemId: string) => {
        setIsLoading(true);

        try {
            // Find the item before removing it so we can show a notification
            const itemToRemove = wishlistItems.find(item => item.id === itemId);

            if (user) {
                // For logged in users, remove from database
                const { error } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('id', itemId);

                if (error) {
                    console.error('Error removing from wishlist:', error);
                    if (error.code !== '42501') {
                        throw error;
                    }
                }
            }

            // Update local state
            setWishlistItems(prev => prev.filter(item => item.id !== itemId));

            // Show notification if we found the item
            if (itemToRemove) {
                showNotification(`Removed from favorites: ${itemToRemove.name}`, 'info');
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            showNotification('Failed to remove item from favorites', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const clearWishlist = async () => {
        setIsLoading(true);

        try {
            if (user) {
                // For logged in users, clear wishlist in database
                const { error } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error clearing wishlist:', error);
                    if (error.code !== '42501') {
                        throw error;
                    }
                }
            }

            // Clear local state
            setWishlistItems([]);

            // Show notification
            showNotification('Favorites cleared successfully', 'info');
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            showNotification('Failed to clear favorites', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                isLoading,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                clearWishlist
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
} 