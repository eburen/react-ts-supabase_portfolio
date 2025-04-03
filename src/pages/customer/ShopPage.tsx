import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/common/ProductCard';
import { Product } from '../../types';

const ShopPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(1000);

    // Get filter values from URL
    const categoryFilter = searchParams.get('category') || '';
    const sortBy = searchParams.get('sort') || 'newest';
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);

                // Start building the query for products
                let query = supabase
                    .from('products')
                    .select('*');

                // Apply category filter if present
                if (categoryFilter) {
                    query = query.eq('category', categoryFilter);
                }

                // Apply search filter if present
                if (searchQuery) {
                    query = query.ilike('name', `%${searchQuery}%`);
                }

                // Apply sorting
                switch (sortBy) {
                    case 'newest':
                        query = query.order('created_at', { ascending: false });
                        break;
                    case 'price-low':
                        query = query.order('base_price', { ascending: true });
                        break;
                    case 'price-high':
                        query = query.order('base_price', { ascending: false });
                        break;
                    case 'rating':
                        query = query.order('average_rating', { ascending: false });
                        break;
                    default:
                        query = query.order('created_at', { ascending: false });
                }

                const { data, error } = await query;

                if (error) {
                    throw error;
                }

                if (data) {
                    // Fetch active sales
                    const { data: salesData } = await supabase
                        .from('product_sales')
                        .select('*')
                        .is('variation_id', null)
                        .eq('active', true)
                        .gte('end_date', new Date().toISOString().split('T')[0])
                        .lte('start_date', new Date().toISOString().split('T')[0]);

                    const activeSales = salesData || [];

                    // Process products to attach sale information
                    const processedData = data.map(product => {
                        const processedProduct = { ...product } as Product;
                        const matchingSale = activeSales.find(
                            sale => sale.product_id === product.id
                        );
                        processedProduct.sale = matchingSale || undefined;
                        return processedProduct;
                    });

                    // Filter by price client-side
                    const filteredData = processedData.filter(
                        product => product.base_price >= minPrice && product.base_price <= maxPrice
                    );
                    setProducts(filteredData);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                setError('Failed to load products');
            } finally {
                setLoading(false);
            }
        }

        async function fetchCategories() {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('category')
                    .order('category');

                if (error) {
                    throw error;
                }

                if (data) {
                    // Extract unique categories
                    const uniqueCategories = [...new Set(data.map(item => item.category))];
                    setCategories(uniqueCategories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        }

        fetchProducts();
        fetchCategories();
    }, [categoryFilter, sortBy, searchQuery, minPrice, maxPrice]);

    const updateFilters = (key: string, value: string) => {
        // Update search params
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const searchValue = formData.get('search') as string;
        updateFilters('search', searchValue);
    };

    const handlePriceFilter = () => {
        // We need to re-trigger the products fetch with the current filters
        // Since fetchProducts is in a useEffect, we'll just force a re-render
        // by updating the state values that trigger the effect
        setMinPrice(prev => prev); // This will cause the useEffect to run again with same values
    };

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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Shop All Products</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Filters sidebar */}
                    <div className="w-full md:w-64 bg-white p-4 rounded-lg shadow">
                        <h2 className="font-bold text-lg mb-4">Filters</h2>

                        {/* Search */}
                        <div className="mb-6">
                            <form onSubmit={handleSearch}>
                                <div className="flex items-center border rounded overflow-hidden">
                                    <input
                                        type="text"
                                        name="search"
                                        placeholder="Search products..."
                                        defaultValue={searchQuery}
                                        className="w-full p-2 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white p-2 hover:bg-blue-700"
                                    >
                                        Search
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Categories */}
                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Categories</h3>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={categoryFilter === ''}
                                        onChange={() => updateFilters('category', '')}
                                        className="mr-2"
                                    />
                                    <span>All Categories</span>
                                </label>
                                {categories.map(category => (
                                    <label key={category} className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={categoryFilter === category}
                                            onChange={() => updateFilters('category', category)}
                                            className="mr-2"
                                        />
                                        <span>{category}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price range */}
                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Price Range</h3>
                            <div className="flex items-center space-x-2 mb-2">
                                <input
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(Number(e.target.value))}
                                    className="w-24 p-1 border rounded"
                                />
                                <span>to</span>
                                <input
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="w-24 p-1 border rounded"
                                />
                            </div>
                            <button
                                onClick={handlePriceFilter}
                                className="w-full bg-gray-200 hover:bg-gray-300 py-1 px-3 rounded"
                            >
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Product grid */}
                    <div className="flex-1">
                        {/* Sort controls */}
                        <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center justify-between">
                            <div>
                                <span className="text-gray-600">
                                    {products.length} {products.length === 1 ? 'product' : 'products'} found
                                </span>
                            </div>
                            <div>
                                <label className="text-gray-600 mr-2">Sort by:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => updateFilters('sort', e.target.value)}
                                    className="border rounded p-1"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="rating">Best Rating</option>
                                </select>
                            </div>
                        </div>

                        {/* Products grid */}
                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-lg shadow text-center">
                                <p className="text-lg text-gray-600">No products found matching your criteria.</p>
                                <button
                                    onClick={() => setSearchParams(new URLSearchParams())}
                                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopPage; 