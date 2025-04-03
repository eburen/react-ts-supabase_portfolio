import { supabase } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Define coupon types
export interface CouponData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_purchase?: number | null;
  expiry_date?: string | null;
  is_active: boolean;
}

// Coupon functions
export const verifyCoupon = async (code: string, orderTotal?: number): Promise<{ valid: boolean; message: string; discount?: number }> => {
  try {
    // Normalize the code
    const normalizedCode = code.trim().toUpperCase();
    
    // First check if the coupon exists and is active
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .single();
    
    if (error || !data) {
      return { valid: false, message: 'Invalid coupon code' };
    }
    
    // Check if coupon is active
    if (!data.is_active) {
      return { valid: false, message: 'This coupon is inactive' };
    }
    
    // Check if coupon is expired
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      return { valid: false, message: 'This coupon has expired' };
    }
    
    // Check minimum purchase requirement if order total is provided
    if (orderTotal !== undefined && data.minimum_purchase && orderTotal < data.minimum_purchase) {
      return { 
        valid: false, 
        message: `This coupon requires a minimum purchase of $${data.minimum_purchase.toFixed(2)}` 
      };
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (orderTotal !== undefined) {
      if (data.discount_type === 'percentage') {
        discountAmount = orderTotal * (data.discount_value / 100);
      } else { // fixed discount
        discountAmount = Math.min(data.discount_value, orderTotal);
      }
    }
    
    return { 
      valid: true, 
      message: 'Coupon applied successfully', 
      discount: discountAmount 
    };
  } catch (error: unknown) {
    console.error('Error verifying coupon:', error);
    return { valid: false, message: 'Error verifying coupon' };
  }
};

export const fetchCoupons = async () => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    const err = error as PostgrestError | Error;
    console.error('Error fetching coupons:', err);
    return { 
      data: null, 
      error: 'message' in err ? err.message : 'Error fetching coupons' 
    };
  }
};

export const createCoupon = async (couponData: CouponData) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert([couponData])
      .select();
      
    if (error) {
      // Check for duplicate code error
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        throw new Error(`Coupon code "${couponData.code}" already exists.`);
      }
      throw error;
    }
    
    return { data, error: null };
  } catch (error: unknown) {
    const err = error as PostgrestError | Error;
    console.error('Error creating coupon:', err);
    return { 
      data: null, 
      error: 'message' in err ? err.message : 'Error creating coupon' 
    };
  }
};

export const updateCoupon = async (id: string, couponData: Partial<CouponData>) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .update(couponData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    const err = error as PostgrestError | Error;
    console.error('Error updating coupon:', err);
    return { 
      data: null, 
      error: 'message' in err ? err.message : 'Error updating coupon' 
    };
  }
};

export const deleteCoupon = async (id: string) => {
  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { error: null };
  } catch (error: unknown) {
    const err = error as PostgrestError | Error;
    console.error('Error deleting coupon:', err);
    return { 
      error: 'message' in err ? err.message : 'Error deleting coupon' 
    };
  }
};

export const toggleCouponStatus = async (id: string, isActive: boolean) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .update({ is_active: isActive })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    const err = error as PostgrestError | Error;
    console.error('Error toggling coupon status:', err);
    return { 
      data: null, 
      error: 'message' in err ? err.message : 'Error updating coupon status' 
    };
  }
}; 