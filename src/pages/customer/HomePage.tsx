import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/common/ProductCard';
import { Product } from '../../types';

const HomePage = () => {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeaturedProducts = async () => {
            try {
                // The 'is_featured' column doesn't exist, so we'll just get the most recent products
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (error) throw error;
                setFeaturedProducts(data || []);
            } catch (error) {
                console.error('Error fetching featured products:', error);
                setError('Failed to load featured products');
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                            Quality Products for Your Lifestyle
                        </h1>
                        <p className="text-lg md:text-xl mb-8">
                            Browse our curated collection of premium products.
                        </p>
                        <Link
                            to="/shop"
                            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                        >
                            Shop Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* Featured Products */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Products</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredProducts.length > 0 ? (
                        featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 py-12">
                            No featured products available.
                        </p>
                    )}
                </div>
            </div>

            {/* Categories Section */}
            <div className="bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Shop by Category</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Category Cards */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="h-48 bg-indigo-200"></div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2">Electronics</h3>
                                <p className="text-gray-600 mb-4">Latest gadgets and tech essentials</p>
                                <Link to="/shop?category=electronics" className="text-indigo-600 font-medium hover:text-indigo-800">Browse Collection →</Link>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="h-48 bg-purple-200"></div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2">Home Decor</h3>
                                <p className="text-gray-600 mb-4">Elevate your living space</p>
                                <Link to="/shop?category=home" className="text-indigo-600 font-medium hover:text-indigo-800">Browse Collection →</Link>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="h-48 bg-green-200"></div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2">Lifestyle</h3>
                                <p className="text-gray-600 mb-4">Everyday essentials curated for you</p>
                                <Link to="/shop?category=lifestyle" className="text-indigo-600 font-medium hover:text-indigo-800">Browse Collection →</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage; 