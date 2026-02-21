import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'implicit'
      }
    })
  : null;

const getSupabase = () => supabase;

/**
 * Create evaluation purchase record
 */
export const createPurchase = async (purchaseData) => {
  const client = getSupabase();
  if (!client) {
    const purchase = {
      id: crypto.randomUUID(),
      ...purchaseData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    const purchases = JSON.parse(localStorage.getItem('mcc_purchases') || '[]');
    purchases.push(purchase);
    localStorage.setItem('mcc_purchases', JSON.stringify(purchases));
    return purchase;
  }

  const { data, error } = await client
    .from('purchases')
    .insert(purchaseData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update purchase status after payment
 */
export const updatePurchaseStatus = async (purchaseId, status, paymentId) => {
  const client = getSupabase();
  if (!client) {
    const purchases = JSON.parse(localStorage.getItem('mcc_purchases') || '[]');
    const idx = purchases.findIndex(p => p.id === purchaseId);
    if (idx >= 0) {
      purchases[idx].status = status;
      purchases[idx].payment_id = paymentId;
      if (status === 'paid') purchases[idx].paid_at = new Date().toISOString();
      localStorage.setItem('mcc_purchases', JSON.stringify(purchases));
    }
    return purchases[idx];
  }

  const { data, error } = await client
    .from('purchases')
    .update({
      status,
      payment_id: paymentId,
      ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {})
    })
    .eq('id', purchaseId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create new evaluation entry
 */
export const createEvaluation = async (userId, evalType = 1) => {
  const client = getSupabase();
  if (!client) {
    const evalEntry = {
      id: Date.now(),
      user_id: userId,
      eval_type: evalType,
      times: 1,
      progress: 0,
      start_date: new Date().toISOString(),
      end_date: null
    };
    const evals = JSON.parse(localStorage.getItem('mcc_evals') || '[]');
    evals.push(evalEntry);
    localStorage.setItem('mcc_evals', JSON.stringify(evals));
    return evalEntry;
  }

  // Get the next times value for this user
  const { data: existing } = await client
    .from('eval_list')
    .select('times')
    .eq('user_id', userId)
    .eq('eval_type', evalType)
    .order('times', { ascending: false })
    .limit(1);

  const nextTimes = (existing?.[0]?.times || 0) + 1;

  const { data, error } = await client
    .from('eval_list')
    .insert({
      user_id: userId,
      eval_type: evalType,
      times: nextTimes,
      progress: 0,
      start_date: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get evaluation list for a user
 */
export const getEvaluations = async (userId) => {
  const client = getSupabase();
  if (!client) {
    const evals = JSON.parse(localStorage.getItem('mcc_evals') || '[]');
    return evals.filter(e => e.user_id === userId);
  }

  const { data, error } = await client
    .from('eval_list')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get evaluation questions for an eval
 */
export const getEvalQuestions = async (evalId) => {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('eval_questions')
    .select('*, std_question:questions!eval_questions_stdq_id_fkey(q_text), cmp_question:questions!eval_questions_cmpq_id_fkey(q_text)')
    .eq('eval_id', evalId)
    .order('id');

  if (error) throw error;
  return data || [];
};

/**
 * Save answer for a question
 */
export const saveAnswer = async (questionId, stdPoint) => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client
    .from('eval_questions')
    .update({ std_point: stdPoint })
    .eq('id', questionId);

  if (error) throw error;
};

/**
 * Get evaluation result
 */
export const getResult = async (evalId) => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('results')
    .select('*')
    .eq('eval_id', evalId)
    .single();

  if (error) return null;
  return data;
};

/**
 * Verify payment via Edge Function
 */
export const verifyPayment = async (paymentId, purchaseId) => {
  const client = getSupabase();
  if (!client) {
    await updatePurchaseStatus(purchaseId, 'paid', paymentId);
    return { verified: true };
  }

  const { data, error } = await client.functions.invoke('verify-payment', {
    body: { paymentId, purchaseId }
  });

  if (error) throw error;
  return data;
};

/**
 * Validate coupon code
 */
export const validateCoupon = async (code) => {
  const client = getSupabase();
  if (!client) return { valid: false, message: 'Supabase not configured' };

  const { data, error } = await client
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_used', false)
    .single();

  if (error || !data) return { valid: false, message: '유효하지 않은 쿠폰 코드입니다.' };
  return { valid: true, coupon: data };
};

/**
 * Use coupon
 */
export const useCoupon = async (couponId, userId) => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client
    .from('coupons')
    .update({ is_used: true, used_by: userId, used_at: new Date().toISOString() })
    .eq('id', couponId);

  if (error) throw error;
};

export default getSupabase;
