import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Product, ProductVariation } from '../../types';
import { ArrowLeftIcon, XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ProductVariationManager from '../../components/admin/ProductVariationManager';
import ProductSaleManager from '../../components/admin/ProductSaleManager';
import { useNotification } from '../../context/NotificationContext';

const ProductDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [product, setProduct] = useState<Product | null>(null);
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProductDetails = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setProduct(data);

                // Fetch product variations
                const { data: variationsData, error: variationsError } = await supabase
                    .from('product_variations')
                    .select('*')
                    .eq('product_id', id);

                if (variationsError) throw variationsError;
                setVariations(variationsData || []);
            } else {
                setError('Product not found');
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
    }, [id]);

    const handleDeleteProduct = async () => {
        if (!product) return;

        if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            try {
                // First delete variations to maintain referential integrity
                if (variations.length > 0) {
                    const { error: variationsError } = await supabase
                        .from('product_variations')
                        .delete()
                        .eq('product_id', product.id);

                    if (variationsError) throw variationsError;
                }

                // Then delete the product
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', product.id);

                if (error) throw error;

                // Navigate back to products list
                navigate('/admin/products');
            } catch (error) {
                console.error('Error deleting product:', error);
                showNotification('Failed to delete product', 'error');
            }
        }
    };

    const renderStars = (rating: number | null | undefined) => {
        if (!rating) return 'No ratings';

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                        {i < fullStars ? "★" : (i === fullStars && hasHalfStar ? "✭" : "☆")}
                    </span>
                ))}
                <span className="ml-2 text-gray-600">({rating.toFixed(1)})</span>
            </div>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (error || !product) {
        return (
            <AdminLayout>
                <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                        <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-sm text-red-700 mt-2">{error || 'Product not found'}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Back to Products
                    </button>
                </div>
            </AdminLayout>
        );
    }

    // Group variations by type
    const groupedVariations: Record<string, ProductVariation[]> = {};
    variations.forEach(variation => {
        if (!groupedVariations[variation.type]) {
            groupedVariations[variation.type] = [];
        }
        groupedVariations[variation.type].push(variation);
    });

    return (
        <AdminLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <Link
                        to="/admin/products"
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    >
                        <ArrowLeftIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                        Back to Products
                    </Link>
                    <div className="flex space-x-3">
                        <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <PencilIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Edit Product
                        </Link>
                        <button
                            type="button"
                            onClick={handleDeleteProduct}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Delete Product
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Product Details
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            View and manage product information
                        </p>
                    </div>
                    <div className="border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            <div>
                                <div className="aspect-w-1 aspect-h-1 rounded-lg bg-gray-100 overflow-hidden mb-6">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <span className="text-gray-500">No image available</span>
                                        </div>
                                    )}
                                </div>

                                {/* Gallery */}
                                {product.images && product.images.length > 1 && (
                                    <div className="grid grid-cols-5 gap-2">
                                        {product.images.map((image, index) => (
                                            <div key={index} className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden">
                                                <img
                                                    src={image}
                                                    alt={`${product.name} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {product.category}
                                    </span>
                                    <div className="text-sm text-gray-500">
                                        ID: {product.id.substring(0, 8)}...
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-2xl font-bold text-gray-900 mb-1">
                                        ${product.base_price.toFixed(2)}
                                    </p>
                                    <div className="text-sm text-gray-500">
                                        {renderStars(product.average_rating)}
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4 mb-4">
                                    <h3 className="text-md font-medium text-gray-900 mb-2">Description</h3>
                                    <p className="text-gray-700">{product.description}</p>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="text-md font-medium text-gray-900 mb-2">Additional Information</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-gray-500">Created</div>
                                        <div className="text-gray-900">{new Date(product.created_at).toLocaleDateString()}</div>
                                        <div className="text-gray-500">Last Updated</div>
                                        <div className="text-gray-900">{new Date(product.updated_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Variations Manager */}
                <ProductVariationManager
                    productId={product.id}
                    refreshProductDetails={fetchProductDetails}
                />

                {/* Product Sales Manager */}
                <ProductSaleManager
                    productId={product.id}
                    variations={variations}
                    refreshProductDetails={fetchProductDetails}
                />
            </div>
        </AdminLayout>
    );
};

export default ProductDetailPage; 