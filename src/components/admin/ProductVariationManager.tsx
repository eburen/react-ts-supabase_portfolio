import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ProductVariation, ProductVariationType } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ProductVariationManagerProps {
    productId: string;
    refreshProductDetails?: () => void;
}

const ProductVariationManager = ({ productId, refreshProductDetails }: ProductVariationManagerProps) => {
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingVariationId, setEditingVariationId] = useState<string | null>(null);
    const [variationType, setVariationType] = useState<ProductVariationType>('size');
    const [variationName, setVariationName] = useState('');
    const [priceAdjustment, setPriceAdjustment] = useState('0');
    const [stock, setStock] = useState('0');

    useEffect(() => {
        fetchVariations();
    }, [productId]);

    const fetchVariations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('product_variations')
                .select('*')
                .eq('product_id', productId)
                .order('type')
                .order('name');

            if (error) throw error;

            setVariations(data || []);
        } catch (error) {
            console.error('Error fetching variations:', error);
            setError('Failed to load product variations');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setVariationType('size');
        setVariationName('');
        setPriceAdjustment('0');
        setStock('0');
        setIsAdding(false);
        setIsEditing(false);
        setEditingVariationId(null);
        setError(null);
    };

    const handleStartEdit = (variation: ProductVariation) => {
        setEditingVariationId(variation.id);
        setVariationType(variation.type);
        setVariationName(variation.name);
        setPriceAdjustment(variation.price_adjustment.toString());
        setStock(variation.stock.toString());
        setIsEditing(true);
        setIsAdding(false);
    };

    const handleSaveVariation = async () => {
        if (!variationName.trim()) {
            setError('Variation name is required');
            return;
        }

        try {
            const variationData = {
                product_id: productId,
                type: variationType,
                name: variationName.trim(),
                price_adjustment: parseFloat(priceAdjustment) || 0,
                stock: parseInt(stock) || 0
            };

            if (isEditing && editingVariationId) {
                // Update existing variation
                const { error } = await supabase
                    .from('product_variations')
                    .update(variationData)
                    .eq('id', editingVariationId);

                if (error) throw error;
            } else {
                // Add new variation
                const { error } = await supabase
                    .from('product_variations')
                    .insert([variationData]);

                if (error) throw error;
            }

            resetForm();
            fetchVariations();
            if (refreshProductDetails) {
                refreshProductDetails();
            }
        } catch (error) {
            console.error('Error saving variation:', error);
            setError('Failed to save variation');
        }
    };

    const handleDeleteVariation = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this variation?')) {
            try {
                const { error } = await supabase
                    .from('product_variations')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                fetchVariations();
                if (refreshProductDetails) {
                    refreshProductDetails();
                }
            } catch (error) {
                console.error('Error deleting variation:', error);
                setError('Failed to delete variation');
            }
        }
    };

    // Group variations by type
    const groupedVariations: Record<string, ProductVariation[]> = {};
    variations.forEach(variation => {
        if (!groupedVariations[variation.type]) {
            groupedVariations[variation.type] = [];
        }
        groupedVariations[variation.type].push(variation);
    });

    return (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Product Variations
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Manage variations like size, color, and bundle options
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        resetForm();
                        setIsAdding(true);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
                    Add Variation
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="mx-4 my-2 rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-sm text-red-700 mt-2">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit form */}
            {(isAdding || isEditing) && (
                <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="variationType" className="block text-sm font-medium text-gray-700">
                                Type
                            </label>
                            <select
                                id="variationType"
                                value={variationType}
                                onChange={(e) => setVariationType(e.target.value as ProductVariationType)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="size">Size</option>
                                <option value="color">Color</option>
                                <option value="bundle">Bundle</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="variationName" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                type="text"
                                id="variationName"
                                value={variationName}
                                onChange={(e) => setVariationName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder={variationType === 'size' ? 'e.g., Small, Medium, Large' :
                                    variationType === 'color' ? 'e.g., Red, Blue, Green' :
                                        'e.g., Basic, Premium'}
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label htmlFor="priceAdjustment" className="block text-sm font-medium text-gray-700">
                                Price Adjustment
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    id="priceAdjustment"
                                    value={priceAdjustment}
                                    onChange={(e) => setPriceAdjustment(e.target.value)}
                                    className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-1">
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                                Stock
                            </label>
                            <input
                                type="number"
                                id="stock"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveVariation}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isEditing ? 'Update' : 'Add'} Variation
                        </button>
                    </div>
                </div>
            )}

            {/* Variations list */}
            <div className="border-t border-gray-200">
                {loading ? (
                    <div className="flex justify-center items-center h-20">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : variations.length === 0 ? (
                    <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                        No variations added yet
                    </div>
                ) : (
                    <div className="px-4 py-5 sm:p-6">
                        {Object.entries(groupedVariations).map(([type, typeVariations]) => (
                            <div key={type} className="mb-6 last:mb-0">
                                <h4 className="text-sm font-medium text-gray-900 mb-3 capitalize">
                                    {type}
                                </h4>
                                <div className="bg-gray-50 rounded-md overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Price Adjustment
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Stock
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {typeVariations.map((variation) => (
                                                <tr key={variation.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {variation.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {variation.price_adjustment > 0 && '+'}{variation.price_adjustment.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {variation.stock}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-3">
                                                            <button
                                                                onClick={() => handleStartEdit(variation)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                <PencilIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteVariation(variation.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductVariationManager; 