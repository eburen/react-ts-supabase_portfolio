import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { Product, ProductVariation } from '../../types';

type Review = {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    text: string;
    created_at: string;
    users: {
        full_name: string;
    };
};

const ProductPage = () => {
    const { id } = useParams<{ id: string }>();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

    useEffect(() => {
        async function fetchProductDetails() {
            if (!id) return;

            try {
                // Fetch product
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (productError) throw productError;
                if (!productData) throw new Error('Product not found');

                setProduct(productData);

                // Fetch product variations
                const { data: variationsData, error: variationsError } = await supabase
                    .from('product_variations')
                    .select('*')
                    .eq('product_id', id)
                    .order('type', { ascending: true })
                    .order('name', { ascending: true });

                if (variationsError) throw variationsError;
                setVariations(variationsData || []);

                // Set default selected variation if available
                if (variationsData && variationsData.length > 0) {
                    setSelectedVariation(variationsData[0].id);
                }

                // Fetch reviews with user info
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*, users(full_name)')
                    .eq('product_id', id)
                    .order('created_at', { ascending: false });

                if (reviewsError) throw reviewsError;
                setReviews(reviewsData || []);

            } catch (error) {
                console.error('Error fetching product details:', error);
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        }

        fetchProductDetails();
    }, [id]);

    const handleAddToCart = async () => {
        if (!product) return;

        try {
            await addToCart(product.id, quantity, selectedVariation || undefined);
            alert('Product added to cart!');
        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('Failed to add product to cart. Please try again.');
        }
    };

    const getGroupedVariations = () => {
        const grouped: Record<string, ProductVariation[]> = {};

        variations.forEach(variation => {
            if (!grouped[variation.type]) {
                grouped[variation.type] = [];
            }
            grouped[variation.type].push(variation);
        });

        return grouped;
    };

    const renderStars = (rating: number | null) => {
        if (rating === null) return null;

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">
                        {i < fullStars ? "★" : (i === fullStars && hasHalfStar ? "✭" : "☆")}
                    </span>
                ))}
                <span className="ml-2 text-gray-600">({rating.toFixed(1)})</span>
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error || 'Product not found'}</span>
                    <Link to="/shop" className="block mt-4 text-blue-600 hover:underline">
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    // Determine if the selected variation has stock
    const selectedVariationData = selectedVariation
        ? variations.find(v => v.id === selectedVariation)
        : null;

    const inStock = selectedVariationData ? selectedVariationData.stock > 0 : true;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link to="/shop" className="text-blue-600 hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Back to Shop
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                        {/* Product Images */}
                        <div>
                            <div className="rounded-lg overflow-hidden bg-gray-100 mb-4">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={product.images[activeImageIndex]}
                                        alt={product.name}
                                        className="w-full h-96 object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-96 flex items-center justify-center bg-gray-200">
                                        <span className="text-gray-500">No image available</span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail images */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex space-x-2 mt-2 overflow-x-auto pb-2">
                                    {product.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveImageIndex(index)}
                                            className={`w-20 h-20 rounded border-2 ${index === activeImageIndex ? 'border-blue-500' : 'border-transparent'
                                                }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`${product.name} - view ${index + 1}`}
                                                className="w-full h-full object-cover rounded"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

                            <div className="mb-4">
                                {renderStars(product.average_rating !== undefined ? product.average_rating : null)}
                                <Link to="#reviews" className="text-blue-600 hover:underline text-sm">
                                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                                </Link>
                            </div>

                            <div className="mb-6">
                                <p className="text-2xl font-bold text-gray-900">
                                    ${(product.base_price + (selectedVariationData?.price_adjustment || 0)).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {inStock ?
                                        `In Stock: ${selectedVariationData?.stock || 'Available'}` :
                                        'Out of Stock'}
                                </p>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-700 mb-4">{product.description}</p>
                                <p className="text-sm text-gray-500">
                                    Category: <span className="text-gray-700">{product.category}</span>
                                </p>
                            </div>

                            {/* Variations */}
                            {variations.length > 0 && (
                                <div className="mb-6">
                                    {Object.entries(getGroupedVariations()).map(([type, options]) => (
                                        <div key={type} className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                                                Select {type}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {options.map(variation => (
                                                    <button
                                                        key={variation.id}
                                                        onClick={() => setSelectedVariation(variation.id)}
                                                        disabled={variation.stock === 0}
                                                        className={`px-4 py-2 border rounded-md ${selectedVariation === variation.id
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : variation.stock === 0
                                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {variation.name}
                                                        {variation.price_adjustment > 0 && ` (+$${variation.price_adjustment.toFixed(2)})`}
                                                        {variation.price_adjustment < 0 && ` (-$${Math.abs(variation.price_adjustment).toFixed(2)})`}
                                                        {variation.stock === 0 && ' - Sold Out'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quantity and Add to Cart */}
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="flex items-center border rounded-md">
                                    <button
                                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                        className="px-3 py-1 border-r hover:bg-gray-100"
                                    >
                                        -
                                    </button>
                                    <span className="px-4 py-1">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(prev => prev + 1)}
                                        className="px-3 py-1 border-l hover:bg-gray-100"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={!inStock}
                                    className={`flex-1 py-2 px-4 rounded-md font-medium ${inStock
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {inStock ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="border-t border-gray-200 p-6" id="reviews">
                        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

                        {reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map(review => (
                                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                                        <div className="flex items-center mb-2">
                                            <div className="font-medium mr-2">{review.users?.full_name || 'Anonymous'}</div>
                                            <div className="text-sm text-gray-500">{formatDate(review.created_at)}</div>
                                        </div>
                                        <div className="mb-2">
                                            {renderStars(review.rating)}
                                        </div>
                                        <p className="text-gray-700">{review.text}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage; 