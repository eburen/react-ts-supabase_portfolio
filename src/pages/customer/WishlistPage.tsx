import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import { HeartIcon, ShoppingCartIcon, TrashIcon } from '@heroicons/react/24/outline';

const WishlistPage = () => {
    const { wishlistItems, removeFromWishlist, clearWishlist, isLoading } = useWishlist();
    const { addToCart } = useCart();

    const handleAddToCart = async (productId: string) => {
        try {
            await addToCart(productId, 1);
        } catch (error) {
            console.error('Error adding product to cart:', error);
        }
    };

    const handleRemoveFromWishlist = async (itemId: string) => {
        try {
            await removeFromWishlist(itemId);
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    const handleClearWishlist = async () => {
        if (window.confirm('Are you sure you want to clear your favorites?')) {
            try {
                await clearWishlist();
            } catch (error) {
                console.error('Error clearing wishlist:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <HeartIcon className="h-8 w-8 text-red-500 mr-3" />
                        My Favorites
                    </h1>

                    {wishlistItems.length > 0 && (
                        <button
                            onClick={handleClearWishlist}
                            className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <TrashIcon className="h-5 w-5 mr-2 text-gray-400" />
                            Clear All
                        </button>
                    )}
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                        <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Your favorites list is empty</h3>
                        <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon on products</p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {wishlistItems.map((item) => (
                                <li key={item.id || `wishlist-${item.product_id}`} className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md overflow-hidden">
                                            <img
                                                src={item.image || '/images/placeholder.jpg'}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <Link to={`/product/${item.product_id}`} className="text-lg font-medium text-indigo-600 hover:text-indigo-700">
                                                    {item.name}
                                                </Link>
                                                <div className="ml-4 flex-shrink-0 flex">
                                                    <button
                                                        onClick={() => handleAddToCart(item.product_id)}
                                                        className="mr-2 flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        <ShoppingCartIcon className="h-4 w-4 mr-1" />
                                                        Add to Cart
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFromWishlist(item.id)}
                                                        className="flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        <TrashIcon className="h-4 w-4 mr-1" />
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex justify-between">
                                                <div className="flex items-center">
                                                    {item.original_price ? (
                                                        <>
                                                            <span className="text-lg font-semibold text-red-600">${item.price.toFixed(2)}</span>
                                                            <span className="ml-2 text-sm text-gray-500 line-through">${item.original_price.toFixed(2)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-lg font-semibold text-gray-900">${item.price.toFixed(2)}</span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    Added on {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage; 