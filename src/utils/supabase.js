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
 * Generate 56 question pairs using the legacy extractQ algorithm.
 * - 8 sections × 14 questions each = 112 total questions
 * - Per section: 7 randomly chosen as "standard", remaining 7 as comparison pool
 * - 56 pairs: each standard question from section i paired with a comparison
 *   question from section j (j≠i), comparison duplicates allowed up to 2 times
 *
 * @param {Object} questionsBySection - { 1: [{id, q_no}, ...], ..., 8: [...] }
 * @returns {Array<{stdq_id: number, cmpq_id: number}>} 56 pairs
 */
function generateQuestionPairs(questionsBySection) {
  const SECTION_NUM = 8;
  const QUESTION_NUM = 14;
  const EXTRACT_STD_NUM = 7;
  const REMAIN_NUM = QUESTION_NUM - EXTRACT_STD_NUM; // 7

  // Build lookup: section -> q_no -> question id
  const qLookup = {};
  for (let s = 1; s <= SECTION_NUM; s++) {
    qLookup[s] = {};
    const qs = questionsBySection[s] || [];
    if (qs.length < QUESTION_NUM) {
      throw new Error(`영역 ${s}에 문항이 ${qs.length}개뿐입니다 (${QUESTION_NUM}개 필요).`);
    }
    for (const q of qs) {
      qLookup[s][q.q_no] = q.id;
    }
  }

  // 1. Extract 7 standard q_nos per section (random, unique within section)
  const standard = Array.from({ length: SECTION_NUM }, () => new Array(EXTRACT_STD_NUM));
  for (let section = 0; section < SECTION_NUM; section++) {
    for (let i = 0; i < EXTRACT_STD_NUM; i++) {
      let unique = false;
      while (!unique) {
        standard[section][i] = Math.floor(Math.random() * QUESTION_NUM) + 1;
        unique = true;
        for (let j = 0; j < i; j++) {
          if (standard[section][i] === standard[section][j]) {
            unique = false;
            break;
          }
        }
      }
    }
  }

  // 2. Build remaining q_nos per section (those not in standard)
  const remainQ = Array.from({ length: SECTION_NUM }, () => new Array(REMAIN_NUM));
  for (let section = 0; section < SECTION_NUM; section++) {
    let idx = 0;
    for (let num = 0; num < QUESTION_NUM; num++) {
      const qNo = num + 1;
      const isStd = standard[section].some(s => s === qNo);
      if (!isStd) {
        remainQ[section][idx] = qNo;
        idx++;
      }
    }
  }

  // 3. Extract comparison questions: compared[std_sctn][cmp_sctn] = q_no from cmp_sctn's remain pool
  //    Duplicate usage per comparison question allowed up to 2 times
  const dupCnt = Array.from({ length: SECTION_NUM }, () => new Array(REMAIN_NUM).fill(0));
  const compared = Array.from({ length: SECTION_NUM }, () => new Array(SECTION_NUM).fill(0));

  for (let cmpSctn = 0; cmpSctn < SECTION_NUM; cmpSctn++) {
    for (let stdSctn = 0; stdSctn < SECTION_NUM; stdSctn++) {
      if (stdSctn !== cmpSctn) {
        let placed = false;
        while (!placed) {
          const idx = Math.floor(Math.random() * REMAIN_NUM);
          if (dupCnt[cmpSctn][idx] <= 1) {
            compared[stdSctn][cmpSctn] = remainQ[cmpSctn][idx];
            dupCnt[cmpSctn][idx]++;
            placed = true;
          }
        }
      }
    }
  }

  // 4. Build 56 pairs
  const pairs = [];
  for (let i = 0; i < SECTION_NUM; i++) {
    let n = 0;
    for (let j = 0; j < SECTION_NUM; j++) {
      if (i === j) continue;
      const stdSection = i + 1;
      const cmpSection = j + 1;
      const stdqId = qLookup[stdSection][standard[i][n]];
      const cmpqId = qLookup[cmpSection][compared[i][j]];
      pairs.push({ stdq_id: stdqId, cmpq_id: cmpqId });
      n++;
    }
  }

  return pairs; // 56 pairs
}

/**
 * Create new evaluation entry and generate 56 question pairs
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

  // 1. Insert eval_list record
  const { data: evalData, error: evalError } = await client
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

  if (evalError) throw evalError;

  // 2. Fetch all questions grouped by section
  const { data: allQuestions, error: qError } = await client
    .from('questions')
    .select('id, section, q_no')
    .not('section', 'is', null)
    .not('q_no', 'is', null)
    .order('section')
    .order('q_no');

  if (qError) throw qError;

  const questionsBySection = {};
  for (const q of allQuestions) {
    if (!questionsBySection[q.section]) questionsBySection[q.section] = [];
    questionsBySection[q.section].push(q);
  }

  // 3. Generate 56 question pairs
  const pairs = generateQuestionPairs(questionsBySection);

  // 4. Bulk insert eval_questions
  const evalQuestions = pairs.map(p => ({
    eval_id: evalData.id,
    stdq_id: p.stdq_id,
    cmpq_id: p.cmpq_id,
    std_point: null
  }));

  const { error: insertError } = await client
    .from('eval_questions')
    .insert(evalQuestions);

  if (insertError) throw insertError;

  return evalData;
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
