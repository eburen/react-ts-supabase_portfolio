import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { Product, ProductVariation, Review } from '../../types';
import { TagIcon } from '@heroicons/react/24/solid';

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
                // Fetch product with sales information
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (productError) throw productError;
                if (!productData) throw new Error('Product not found');

                // Fetch active sale for the product
                const { data: productSaleData } = await supabase
                    .from('product_sales')
                    .select('*')
                    .eq('product_id', id)
                    .is('variation_id', null)
                    .eq('active', true)
                    .gte('end_date', new Date().toISOString().split('T')[0])
                    .lte('start_date', new Date().toISOString().split('T')[0])
                    .maybeSingle();

                // Attach sale to product if exists
                productData.sale = productSaleData || undefined;
                setProduct(productData);

                // Fetch product variations with sales information
                const { data: variationsData, error: variationsError } = await supabase
                    .from('product_variations')
                    .select(`
                        *,
                        sale:product_sales(
                            id,
                            product_id,
                            variation_id,
                            discount_percentage,
                            start_date,
                            end_date,
                            active,
                            created_at
                        )
                    `)
                    .eq('product_id', id);

                if (variationsError) throw variationsError;

                let processedVariations = variationsData || [];

                // Process sale information for variations
                if (variationsData && variationsData.length > 0) {
                    // Fetch active sales separately
                    const { data: salesData } = await supabase
                        .from('product_sales')
                        .select('*')
                        .eq('product_id', id)
                        .eq('active', true)
                        .gte('end_date', new Date().toISOString().split('T')[0])
                        .lte('start_date', new Date().toISOString().split('T')[0]);

                    const activeSales = salesData || [];

                    // Match variations with their sales
                    processedVariations = variationsData.map(variation => {
                        const processedVariation = { ...variation };
                        const matchingSale = activeSales.find(
                            sale => sale.variation_id === variation.id
                        );

                        processedVariation.sale = matchingSale || undefined;
                        return processedVariation;
                    });
                }

                setVariations(processedVariations);

                // Set default selected variation if available
                if (processedVariations.length > 0) {
                    setSelectedVariation(processedVariations[0].id);
                }

                // Fetch reviews
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*')
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
            if (selectedVariation) {
                await addToCart(product.id, quantity, selectedVariation);
            } else {
                await addToCart(product.id, quantity);
            }
            alert('Product added to cart!');
        } catch (error) {
            console.error('Error adding product to cart:', error);
            alert('Failed to add product to cart');
        }
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

    const inStock = selectedVariationData
        ? selectedVariationData.stock > 0
        : true;

    // Calculate the current price based on base price, variation adjustment, and any active sale
    let currentPrice = product.base_price;
    let hasActiveSale = false;
    let discountPercentage = 0;

    if (selectedVariationData) {
        currentPrice += selectedVariationData.price_adjustment;

        // Check for variation-specific sale
        if (selectedVariationData.sale &&
            selectedVariationData.sale.active &&
            new Date(selectedVariationData.sale.start_date) <= new Date() &&
            new Date(selectedVariationData.sale.end_date) >= new Date()) {
            hasActiveSale = true;
            discountPercentage = selectedVariationData.sale.discount_percentage;
            currentPrice = currentPrice * (1 - (discountPercentage / 100));
        }
    } else if (product.sale &&
        product.sale.active &&
        new Date(product.sale.start_date) <= new Date() &&
        new Date(product.sale.end_date) >= new Date()) {
        // Check for product-level sale if no variation is selected
        hasActiveSale = true;
        discountPercentage = product.sale.discount_percentage;
        currentPrice = currentPrice * (1 - (discountPercentage / 100));
    }

    // Get original price for display when there's a sale
    const originalPrice = selectedVariationData
        ? product.base_price + selectedVariationData.price_adjustment
        : product.base_price;

    return (
        <div className="bg-white">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <nav className="flex mb-8" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                        <li>
                            <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
                        </li>
                        <li className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <Link to="/shop" className="ml-2 text-gray-500 hover:text-gray-700">Shop</Link>
                        </li>
                        <li className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-gray-900 font-medium">{product.name}</span>
                        </li>
                    </ol>
                </nav>

                <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
                    {/* Product gallery */}
                    <div className="lg:max-w-lg lg:self-start">
                        <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                                <img
                                    src={product.images[activeImageIndex]}
                                    alt={product.name}
                                    className="w-full h-full object-center object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                                    No image available
                                </div>
                            )}

                            {/* Sale badge */}
                            {hasActiveSale && (
                                <div className="absolute top-2 left-2 z-10">
                                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                                        <TagIcon className="h-4 w-4 mr-1" />
                                        {discountPercentage}% OFF
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Image thumbnail gallery */}
                        {product.images && product.images.length > 1 && (
                            <div className="mt-4 grid grid-cols-4 gap-2">
                                {product.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImageIndex(index)}
                                        className={`relative rounded-md overflow-hidden cursor-pointer ${activeImageIndex === index
                                            ? 'ring-2 ring-indigo-500'
                                            : 'border border-gray-200'
                                            }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`${product.name} ${index + 1}`}
                                            className="w-full h-16 object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product info */}
                    <div className="mt-10 lg:mt-0">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

                            <div className="mb-4">
                                {renderStars(product.average_rating !== undefined ? product.average_rating : null)}
                                <Link to="#reviews" className="text-blue-600 hover:underline text-sm">
                                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                                </Link>
                            </div>

                            <div className="mb-6">
                                {hasActiveSale ? (
                                    <div className="flex items-center">
                                        <p className="text-2xl font-bold text-red-600">
                                            ${currentPrice.toFixed(2)}
                                        </p>
                                        <p className="text-lg text-gray-500 line-through ml-3">
                                            ${originalPrice.toFixed(2)}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${currentPrice.toFixed(2)}
                                    </p>
                                )}
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
                                    <h3 className="text-sm font-medium text-gray-900">
                                        {variations[0].type.charAt(0).toUpperCase() + variations[0].type.slice(1)}
                                    </h3>
                                    <div className="mt-2">
                                        <div className="grid grid-cols-4 gap-2">
                                            {variations.map((variation) => (
                                                <button
                                                    key={variation.id}
                                                    type="button"
                                                    onClick={() => setSelectedVariation(variation.id)}
                                                    className={`group relative px-4 py-2 rounded-md border text-sm font-medium
                                                        ${selectedVariation === variation.id
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                                                        }
                                                        ${variation.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                                    `}
                                                    disabled={variation.stock <= 0}
                                                >
                                                    {variation.name}
                                                    {variation.price_adjustment > 0 && (
                                                        <span className="text-xs ml-1">
                                                            (+${variation.price_adjustment.toFixed(2)})
                                                        </span>
                                                    )}
                                                    {variation.sale && (
                                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                            %
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
                                <div className="mt-2 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-3 py-1 border rounded-l-md border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="py-1 px-4 border-t border-b border-gray-300 w-16 text-center"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-3 py-1 border rounded-r-md border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Add to cart button */}
                            <div>
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={!inStock}
                                    className={`w-full py-3 px-8 rounded-md text-white font-medium text-center ${inStock
                                        ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {inStock ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product reviews */}
                <div id="reviews" className="mt-16 pt-8 border-t border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>

                    {reviews.length === 0 ? (
                        <div className="bg-gray-50 p-8 rounded-lg text-center">
                            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-200 pb-8">
                                    <div className="flex items-center mb-2">
                                        <div className="mr-4">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-indigo-800 font-medium">
                                                    {(review.username || 'A').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-900">{review.username || 'Anonymous'}</h4>
                                            <div className="flex items-center">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg
                                                            key={i}
                                                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <span className="ml-2 text-sm text-gray-500">
                                                    {formatDate(review.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-700">{review.comment || review.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductPage; 