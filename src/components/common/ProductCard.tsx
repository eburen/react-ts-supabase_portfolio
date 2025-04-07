import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { TagIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist, wishlistItems } = useWishlist();
    const [isHovered, setIsHovered] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    // Check if product is in favorites
    useEffect(() => {
        setIsFavorite(isInWishlist(product.id));
    }, [product.id, isInWishlist, wishlistItems]);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAddingToCart(true);

        try {
            await addToCart(product.id, 1);
            setTimeout(() => {
                setIsAddingToCart(false);
            }, 600);
        } catch (error) {
            setIsAddingToCart(false);
            console.error("Error adding to cart:", error);
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (isFavorite) {
                // Find the wishlist item ID for this product
                const wishlistItem = wishlistItems.find(item => item.product_id === product.id);
                if (wishlistItem) {
                    await removeFromWishlist(wishlistItem.id);
                }
            } else {
                await addToWishlist(product.id);
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    // Calculate the discounted price if sale exists and is active
    const hasActiveSale = product.sale &&
        product.sale.active &&
        new Date(product.sale.start_date) <= new Date() &&
        new Date(product.sale.end_date) >= new Date();

    const discountedPrice = hasActiveSale
        ? product.base_price * (1 - (product.sale!.discount_percentage / 100))
        : null;

    return (
        <Link
            to={`/product/${product.id}`}
            className="group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative">
                <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                        src={product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:opacity-75 transition-opacity duration-300"
                    />
                </div>

                {hasActiveSale && (
                    <div className="absolute top-2 left-2 z-10">
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {product.sale!.discount_percentage}% OFF
                        </div>
                    </div>
                )}

                {/* Favorite button */}
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={handleToggleFavorite}
                        className={`p-1.5 rounded-full ${isFavorite ? 'bg-red-50' : 'bg-white'} shadow-md hover:shadow-lg transition-all duration-200`}
                    >
                        {isFavorite ? (
                            <HeartSolid className="h-5 w-5 text-red-500" />
                        ) : (
                            <HeartOutline className="h-5 w-5 text-gray-400 hover:text-red-500" />
                        )}
                    </button>
                </div>

                {/* Quick add to cart button that appears on hover */}
                <div
                    className={`absolute bottom-4 right-4 transform transition-all duration-200 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                >
                    <button
                        onClick={handleAddToCart}
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md hover:bg-indigo-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {isAddingToCart ? (
                            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-4 flex justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                    <div className="flex items-center mt-1">
                        {discountedPrice ? (
                            <>
                                <span className="text-sm font-medium text-gray-900">${discountedPrice.toFixed(2)}</span>
                                <span className="ml-2 text-sm text-gray-500 line-through">${product.base_price.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="text-sm font-medium text-gray-900">${product.base_price.toFixed(2)}</span>
                        )}
                    </div>

                    {product.average_rating && (
                        <div className="flex items-center mt-1">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <svg
                                        key={i}
                                        className={`h-4 w-4 ${i < Math.floor(product.average_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="ml-1 text-xs text-gray-500">{product.average_rating.toFixed(1)}</span>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleAddToCart}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isAddingToCart
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white'
                        }`}
                >
                    {isAddingToCart ? 'Added' : 'Add to cart'}
                </button>
            </div>
        </Link>
    );
}
