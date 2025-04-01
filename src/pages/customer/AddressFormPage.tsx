import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AddressForm.css';

const AddressFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        is_default: false
    });

    const [loading, setLoading] = useState(isEditMode);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isEditMode && user) {
            const fetchAddress = async () => {
                try {
                    const { data, error } = await supabase
                        .from('shipping_addresses')
                        .select('*')
                        .eq('id', id)
                        .eq('user_id', user.id)
                        .single();

                    if (error) throw error;
                    if (data) {
                        setFormData(data);
                    } else {
                        setError('Address not found');
                    }
                } catch (error) {
                    console.error('Error fetching address:', error);
                    setError('Failed to load address');
                } finally {
                    setLoading(false);
                }
            };

            fetchAddress();
        } else {
            setLoading(false);
        }
    }, [id, user, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('You must be logged in to save an address');
            return;
        }

        setError(null);
        setSuccess(null);
        setSubmitLoading(true);

        try {
            // Validation
            if (!formData.name || !formData.street || !formData.city || !formData.state || !formData.zipcode || !formData.country) {
                setError('All fields are required');
                setSubmitLoading(false);
                return;
            }

            // If this address is set as default, update all other addresses to not be default
            if (formData.is_default) {
                await supabase
                    .from('shipping_addresses')
                    .update({ is_default: false })
                    .eq('user_id', user.id);
            }

            let result;
            if (isEditMode) {
                // Update existing address
                result = await supabase
                    .from('shipping_addresses')
                    .update({
                        name: formData.name,
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zipcode: formData.zipcode,
                        country: formData.country,
                        is_default: formData.is_default,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id)
                    .eq('user_id', user.id);
            } else {
                // Create new address
                result = await supabase
                    .from('shipping_addresses')
                    .insert({
                        user_id: user.id,
                        name: formData.name,
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zipcode: formData.zipcode,
                        country: formData.country,
                        is_default: formData.is_default
                    });
            }

            if (result.error) throw result.error;

            setSuccess('Address saved successfully');
            setTimeout(() => {
                navigate('/account/addresses');
            }, 1500);
        } catch (error) {
            console.error('Error saving address:', error);
            setError('Failed to save address');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="address-form-container">
                <h1 className="address-form-title">
                    {isEditMode ? 'Edit Address' : 'Add New Address'}
                </h1>

                {error && (
                    <div className="address-form-error" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="address-form-success" role="alert">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="address-form-group">
                        <label htmlFor="name" className="address-form-label">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="address-form-input"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="address-form-group">
                        <label htmlFor="street" className="address-form-label">
                            Street Address
                        </label>
                        <input
                            type="text"
                            id="street"
                            name="street"
                            value={formData.street}
                            onChange={handleChange}
                            className="address-form-input"
                            placeholder="123 Main St"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="address-form-group">
                            <label htmlFor="city" className="address-form-label">
                                City
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="address-form-input"
                                placeholder="San Francisco"
                                required
                            />
                        </div>

                        <div className="address-form-group">
                            <label htmlFor="state" className="address-form-label">
                                State / Province
                            </label>
                            <input
                                type="text"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="address-form-input"
                                placeholder="CA"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="address-form-group">
                            <label htmlFor="zipcode" className="address-form-label">
                                Zip / Postal Code
                            </label>
                            <input
                                type="text"
                                id="zipcode"
                                name="zipcode"
                                value={formData.zipcode}
                                onChange={handleChange}
                                className="address-form-input"
                                placeholder="94103"
                                required
                            />
                        </div>

                        <div className="address-form-group">
                            <label htmlFor="country" className="address-form-label">
                                Country
                            </label>
                            <input
                                type="text"
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="address-form-input"
                                placeholder="United States"
                                required
                            />
                        </div>
                    </div>

                    <div className="address-form-checkbox-group">
                        <input
                            type="checkbox"
                            id="is_default"
                            name="is_default"
                            checked={formData.is_default}
                            onChange={handleChange}
                            className="address-form-checkbox"
                        />
                        <label htmlFor="is_default" className="text-sm text-gray-700">
                            Set as default address
                        </label>
                    </div>

                    <div className="address-form-buttons">
                        <button
                            type="button"
                            onClick={() => navigate('/account/addresses')}
                            className="address-form-button address-form-button-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitLoading}
                            className="address-form-button address-form-button-primary"
                        >
                            {submitLoading ? 'Saving...' : isEditMode ? 'Update Address' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressFormPage; 