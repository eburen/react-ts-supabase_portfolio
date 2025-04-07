import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotification } from '../../context/NotificationContext';
import { Product, ProductVariation, Review } from '../../types';
import { TagIcon, HeartIcon as HeartIconOutline, StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon } from '@heroicons/react/24/solid';

const ProductPage = () => {
    const { id } = useParams<{ id: string }>();
    const { addToCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist, wishlistItems } = useWishlist();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [favoriteId, setFavoriteId] = useState<string | null>(null);
    const [userHasReviewed, setUserHasReviewed] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const fetchProductDetails = async () => {
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

            // Check if current user has already reviewed this product
            if (user) {
                const userReview = reviewsData?.find(review => review.user_id === user.id);
                setUserHasReviewed(!!userReview);
            }

        } catch (error) {
            console.error('Error fetching product details:', error);
            setError('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductDetails();
    }, [id, user]);

    // Check if product is in favorites
    useEffect(() => {
        if (product) {
            const inWishlist = isInWishlist(product.id);
            setIsFavorite(inWishlist);

            // If it's in the wishlist, find the item ID for removal
            if (inWishlist) {
                const wishlistItem = product && wishlistItems.find(item => item.product_id === product.id);
                if (wishlistItem) {
                    setFavoriteId(wishlistItem.id);
                }
            }
        }
    }, [product, isInWishlist, wishlistItems]);

    const handleAddToCart = async () => {
        if (!product) return;

        try {
            if (selectedVariation) {
                await addToCart(product.id, quantity, selectedVariation);
            } else {
                await addToCart(product.id, quantity);
            }
            // Notification is now shown by the CartContext
        } catch (error) {
            console.error('Error adding product to cart:', error);
            // Notification is now shown by the CartContext
        }
    };

    const handleToggleFavorite = async () => {
        if (!product) return;

        try {
            if (isFavorite && favoriteId) {
                await removeFromWishlist(favoriteId);
                setIsFavorite(false);
                setFavoriteId(null);
            } else {
                await addToWishlist(product.id);
                setIsFavorite(true);
                // Update favoriteId after adding to wishlist
                const wishlistItem = product && wishlistItems.find(item => item.product_id === product.id);
                if (wishlistItem) {
                    setFavoriteId(wishlistItem.id);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite status:', error);
        }
    };

    // Function to handle review submission
    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        setReviewSubmitting(true);
        try {
            // Check if user has purchased the product
            const { data: orderItems, error: orderError } = await supabase
                .from('order_items')
                .select('order_id, product_id')
                .eq('product_id', product?.id);

            if (orderError) throw orderError;

            // Get orders by this user that are delivered/completed
            const { data: orders, error: userOrdersError } = await supabase
                .from('orders')
                .select('id')
                .eq('user_id', user.id)
                .in('status', ['delivered', 'completed']);

            if (userOrdersError) throw userOrdersError;

            // Get order IDs
            const orderIds = orders?.map(order => order.id) || [];

            // Check if any of the user's orders contain this product
            const hasPurchased = orderItems?.some(item =>
                orderIds.includes(item.order_id)
            );

            if (!hasPurchased) {
                throw new Error('You can only review products you have purchased');
            }

            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    product_id: product?.id,
                    user_id: user.id,
                    username: user.full_name || user.email.split('@')[0],
                    rating: reviewRating,
                    text: reviewText,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            const newReview = {
                id: data.id,
                product_id: data.product_id,
                user_id: data.user_id,
                username: data.username,
                rating: data.rating,
                text: data.text,
                created_at: data.created_at
            };

            setReviews([newReview, ...reviews]);
            setUserHasReviewed(true);
            setShowReviewForm(false);
            setReviewRating(5);
            setReviewText('');

            // Refresh product details to update average rating
            fetchProductDetails();
            showNotification('Review submitted successfully', 'success');
        } catch (error: unknown) {
            showNotification(error instanceof Error ? error.message : 'Failed to submit review', 'error');
        } finally {
            setReviewSubmitting(false);
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
                            <div className="mt-10 flex sm:flex-col1">
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={!inStock}
                                    className={`max-w-xs flex-1 ${inStock ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
                                        } border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-full`}
                                >
                                    {inStock ? 'Add to Cart' : 'Out of Stock'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleToggleFavorite}
                                    className="ml-4 py-3 px-3 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                                >
                                    {isFavorite ? (
                                        <HeartIconSolid className="h-6 w-6 flex-shrink-0 text-red-500" aria-hidden="true" />
                                    ) : (
                                        <HeartIconOutline className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
                                    )}
                                    <span className="sr-only">{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product reviews */}
                <div id="reviews" className="mt-16 pt-8 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>

                        {user && !userHasReviewed && !showReviewForm && (
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Write a Review
                            </button>
                        )}
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                        <div className="bg-gray-50 p-6 rounded-lg mb-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Write Your Review</h3>
                            <form onSubmit={handleReviewSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setReviewRating(value)}
                                                className="focus:outline-none"
                                            >
                                                {value <= reviewRating ? (
                                                    <StarIcon className="h-8 w-8 text-yellow-400" />
                                                ) : (
                                                    <StarOutlineIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Review
                                    </label>
                                    <textarea
                                        id="review-text"
                                        rows={4}
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        required
                                        placeholder="Share your experience with this product..."
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewForm(false)}
                                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={reviewSubmitting}
                                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${reviewSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Review Summary */}
                    {reviews.length > 0 && (
                        <div className="bg-gray-50 p-6 rounded-lg mb-8">
                            <div className="flex items-center">
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <StarIcon
                                            key={star}
                                            className={`h-5 w-5 ${star <= (product?.average_rating || 0)
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="ml-2 text-sm text-gray-700">
                                    {product?.average_rating?.toFixed(1) || 'N/A'} out of 5 stars ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                                </p>
                            </div>

                            {/* Rating distribution */}
                            <div className="mt-4">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = reviews.filter((review) => review.rating === star).length;
                                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                                    return (
                                        <div key={star} className="flex items-center mt-1">
                                            <div className="flex items-center mr-4 w-20">
                                                <span className="text-sm text-gray-600">{star} stars</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div
                                                    className="bg-yellow-400 h-2.5 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm text-gray-500 w-16 text-right">
                                                {count} ({percentage.toFixed(0)}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Reviews List */}
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
                                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-indigo-800 font-medium text-lg">
                                                    {(review.username || 'A').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-medium text-gray-900">{review.username || 'Anonymous'}</h4>
                                            <div className="flex items-center">
                                                <div className="flex mr-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarIcon
                                                            key={i}
                                                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(review.created_at)}
                                                </span>
                                                {user && review.user_id === user.id && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                        Your Review
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 mt-3">{review.text}</p>
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