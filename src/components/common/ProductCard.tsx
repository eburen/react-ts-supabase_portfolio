import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();

    const handleAddToCart = async () => {
        await addToCart(product.id, 1);
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:shadow-lg hover:-translate-y-1">
            <Link to={`/product/${product.id}`} className="flex-shrink-0">
                <div className="h-48 w-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-gray-400">No image</div>
                    )}
                </div>
            </Link>

            <div className="p-4 flex-grow flex flex-col">
                <Link to={`/product/${product.id}`} className="block mb-2">
                    <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600 truncate">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {product.description}
                </p>

                <div className="mt-auto pt-2 flex items-center justify-between">
                    <p className="text-lg font-medium text-gray-900">
                        ${product.base_price.toFixed(2)}
                    </p>

                    {product.average_rating && (
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="ml-1 text-sm text-gray-500">{product.average_rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleAddToCart}
                    className="mt-4 w-full bg-indigo-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Add to cart
                </button>
            </div>
        </div>
    );
}
