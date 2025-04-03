import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { TagIcon } from '@heroicons/react/24/solid';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [isHovered, setIsHovered] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

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

    // Calculate the discounted price if sale exists and is active
    const hasActiveSale = product.sale &&
        product.sale.active &&
        new Date(product.sale.start_date) <= new Date() &&
        new Date(product.sale.end_date) >= new Date();

    const discountedPrice = hasActiveSale
        ? product.base_price * (1 - (product.sale!.discount_percentage / 100))
        : null;

    return (
        <div
            className="group bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link to={`/product/${product.id}`} className="block relative overflow-hidden h-60">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className={`w-full h-full object-cover transform transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
                        />
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="mt-2">No image</span>
                        </div>
                    )}
                </div>

                {/* Sale badge */}
                {hasActiveSale && (
                    <div className="absolute top-2 left-2 z-10">
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {product.sale!.discount_percentage}% OFF
                        </div>
                    </div>
                )}

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
            </Link>

            <div className="p-5 flex-grow flex flex-col">
                <Link to={`/product/${product.id}`} className="block">
                    <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600 mb-1 truncate">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
                    {product.description}
                </p>

                <div className="flex items-center justify-between">
                    <div>
                        {hasActiveSale ? (
                            <div className="flex items-center">
                                <p className="text-lg font-semibold text-red-600">
                                    ${discountedPrice!.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500 line-through ml-2">
                                    ${product.base_price.toFixed(2)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-lg font-semibold text-gray-900">
                                ${product.base_price.toFixed(2)}
                            </p>
                        )}
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
            </div>
        </div>
    );
}
