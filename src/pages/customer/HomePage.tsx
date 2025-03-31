import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/common/ProductCard';
import { Product } from '../../types';

const HomePage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [featuredCategories, setFeaturedCategories] = useState<string[]>([]);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    throw error;
                }

                if (data) {
                    setProducts(data);

                    // Extract unique categories for featured sections
                    const categories = [...new Set(data.map(product => product.category))];
                    setFeaturedCategories(categories);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                setError('Failed to load products');
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-blue-600 text-white">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-center">
                        Welcome to Our Store
                    </h1>
                    <p className="mt-6 text-xl max-w-3xl text-center">
                        Discover our high-quality products at affordable prices.
                    </p>
                    <div className="mt-8">
                        <Link
                            to="/shop"
                            className="bg-white text-blue-600 px-5 py-3 rounded-md font-medium hover:bg-blue-50 transition"
                        >
                            Browse All Products
                        </Link>
                    </div>
                </div>
            </div>

            {/* Featured Products */}
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold text-gray-900">New Arrivals</h2>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.slice(0, 4).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>

            {/* Featured Categories */}
            {featuredCategories.slice(0, 3).map((category) => (
                <div key={category} className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">{category}</h2>
                        <Link
                            to={`/shop?category=${category}`}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products
                            .filter(product => product.category === category)
                            .slice(0, 4)
                            .map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HomePage; 