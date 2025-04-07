import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ProductFormPage = () => {
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [category, setCategory] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        fetchCategories();

        if (isEditing) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('category')
                .order('category');

            if (error) throw error;

            if (data) {
                // Extract unique categories
                const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
                setCategories(uniqueCategories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProduct = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) throw new Error('Product not found');

            // Populate form with product data
            setName(data.name);
            setDescription(data.description);
            setBasePrice(data.base_price.toString());
            setCategory(data.category);
            setImages(data.images || []);

        } catch (error) {
            console.error('Error fetching product:', error);
            setError('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const handleAddImage = () => {
        if (imageUrl.trim() !== '' && !images.includes(imageUrl)) {
            setImages([...images, imageUrl]);
            setImageUrl('');
        }
    };

    const handleRemoveImage = (index: number) => {
        const updatedImages = [...images];
        updatedImages.splice(index, 1);
        setImages(updatedImages);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!name.trim() || !description.trim() || !basePrice || images.length === 0) {
            setError('Please fill in all required fields and add at least one image');
            return;
        }

        const finalCategory = category === 'new' && newCategory.trim()
            ? newCategory.trim()
            : category;

        if (!finalCategory) {
            setError('Please select or create a category');
            return;
        }

        const productData = {
            name,
            description,
            base_price: parseFloat(basePrice),
            category: finalCategory,
            images
        };

        try {
            setSubmitting(true);

            if (isEditing) {
                // Update existing product
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', id);

                if (error) throw error;

                navigate(`/admin/products/${id}`);
            } else {
                // Create new product
                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select();

                if (error) throw error;

                // Navigate to the new product's detail page
                navigate(`/admin/products/${data[0].id}`);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setError('Failed to save product');
        } finally {
            setSubmitting(false);
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h1>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4 mb-6">
                        <div className="flex">
                            <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <p className="text-sm text-red-700 mt-2">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Product Information
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Fill in the details for your product.
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                {/* Product Name */}
                                <div className="sm:col-span-6">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Product Name*
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="sm:col-span-6">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Description*
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={4}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="sm:col-span-3">
                                    <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
                                        Base Price*
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="basePrice"
                                            id="basePrice"
                                            min="0"
                                            step="0.01"
                                            value={basePrice}
                                            onChange={(e) => setBasePrice(e.target.value)}
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="sm:col-span-3">
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                        Category*
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="category"
                                            name="category"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                            <option value="new">Add New Category</option>
                                        </select>
                                    </div>
                                </div>

                                {/* New Category */}
                                {category === 'new' && (
                                    <div className="sm:col-span-3">
                                        <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700">
                                            New Category*
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="newCategory"
                                                id="newCategory"
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                required={category === 'new'}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Images */}
                                <div className="sm:col-span-6">
                                    <label htmlFor="images" className="block text-sm font-medium text-gray-700">
                                        Product Images*
                                    </label>
                                    <div className="mt-1 flex items-center">
                                        <input
                                            type="url"
                                            id="imageUrl"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="Enter image URL"
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddImage}
                                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Add at least one image URL for your product
                                    </p>

                                    {/* Image Preview */}
                                    {images.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                            {images.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <div className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden bg-gray-100">
                                                        <img src={image} alt={`Product ${index}`} className="object-cover" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 rounded-full p-1 text-white opacity-0 group-hover:opacity-100"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Link
                            to="/admin/products"
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Product'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default ProductFormPage; 