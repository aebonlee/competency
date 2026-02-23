import { createClient } from '@supabase/supabase-js';
import type { Purchase, EvalResult } from '../types';

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

// --- Internal types for question pair generation ---
interface QuestionInput {
  id: string;
  q_no: number;
}

interface QuestionPair {
  stdq_id: string;
  cmpq_id: string;
}

type QuestionsBySection = Record<number, QuestionInput[]>;

/**
 * Create evaluation purchase record
 */
export const createPurchase = async (purchaseData: { user_id: string; amount: number }): Promise<Purchase> => {
  const client = getSupabase();
  if (!client) {
    const purchase: Purchase = {
      id: crypto.randomUUID(),
      ...purchaseData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    const purchases: Purchase[] = JSON.parse(localStorage.getItem('mcc_purchases') || '[]');
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
  return data as Purchase;
};

/**
 * Update purchase status after payment
 */
export const updatePurchaseStatus = async (
  purchaseId: string,
  status: Purchase['status'],
  paymentId?: string
): Promise<Purchase | undefined> => {
  const client = getSupabase();
  if (!client) {
    const purchases: Purchase[] = JSON.parse(localStorage.getItem('mcc_purchases') || '[]');
    const idx = purchases.findIndex(p => p.id === purchaseId);
    if (idx >= 0) {
      purchases[idx].status = status;
      purchases[idx].payment_id = paymentId;
      if (status === 'paid') purchases[idx].paid_at = new Date().toISOString();
      localStorage.setItem('mcc_purchases', JSON.stringify(purchases));
    }
    return purchases[idx];
  }

  const updateData: Record<string, unknown> = { status };
  if (paymentId) updateData.payment_id = paymentId;

  const { data, error } = await client
    .from('purchases')
    .update(updateData)
    .eq('id', purchaseId)
    .select()
    .single();

  if (error) throw error;
  return data as Purchase;
};

/**
 * Generate 56 question pairs using the legacy extractQ algorithm.
 * - 8 sections × 14 questions each = 112 total questions
 * - Per section: 7 randomly chosen as "standard", remaining 7 as comparison pool
 * - 56 pairs: each standard question from section i paired with a comparison
 *   question from section j (j≠i), comparison duplicates allowed up to 2 times
 */
function generateQuestionPairs(questionsBySection: QuestionsBySection): QuestionPair[] {
  const SECTION_NUM = 8;
  const QUESTION_NUM = 14;
  const EXTRACT_STD_NUM = 7;
  const REMAIN_NUM = QUESTION_NUM - EXTRACT_STD_NUM; // 7

  // Build lookup: section -> q_no -> question id
  const qLookup: Record<number, Record<number, string>> = {};
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
  const standard: number[][] = Array.from({ length: SECTION_NUM }, () => new Array<number>(EXTRACT_STD_NUM));
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
  const remainQ: number[][] = Array.from({ length: SECTION_NUM }, () => new Array<number>(REMAIN_NUM));
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

  // 3. Extract comparison questions
  const dupCnt: number[][] = Array.from({ length: SECTION_NUM }, () => new Array<number>(REMAIN_NUM).fill(0));
  const compared: number[][] = Array.from({ length: SECTION_NUM }, () => new Array<number>(SECTION_NUM).fill(0));

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
  const pairs: QuestionPair[] = [];
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
export const createEvaluation = async (userId: string, evalType: number = 1) => {
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

  const nextTimes = ((existing?.[0] as { times?: number })?.times || 0) + 1;

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

  const questionsBySection: QuestionsBySection = {};
  for (const q of (allQuestions || [])) {
    const section = (q as { section: number }).section;
    if (!questionsBySection[section]) questionsBySection[section] = [];
    questionsBySection[section].push(q as QuestionInput);
  }

  // 3. Generate 56 question pairs
  const pairs = generateQuestionPairs(questionsBySection);

  // 4. Bulk insert eval_questions
  const evalQuestions = pairs.map(p => ({
    eval_id: (evalData as { id: string }).id,
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
export const getEvaluations = async (userId: string) => {
  const client = getSupabase();
  if (!client) {
    const evals = JSON.parse(localStorage.getItem('mcc_evals') || '[]');
    return evals.filter((e: { user_id: string }) => e.user_id === userId);
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
export const getEvalQuestions = async (evalId: string) => {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('eval_questions')
    .select('*, std_question:questions!eval_questions_stdq_id_fkey(q_text, section), cmp_question:questions!eval_questions_cmpq_id_fkey(q_text, section)')
    .eq('eval_id', evalId)
    .order('id');

  if (error) throw error;
  return data || [];
};

/**
 * Save answer for a question
 */
export const saveAnswer = async (questionId: string, stdPoint: number): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client
    .from('eval_questions')
    .update({ std_point: stdPoint })
    .eq('id', questionId);

  if (error) throw error;
};

/**
 * Calculate evaluation results (client-side, replaces missing Edge Function).
 * Algorithm from legacy updateEval.jsp:
 *   point[std_section] += std_point
 *   point[cmp_section] += (30 - std_point)
 */
export const calculateResults = async (evalId: string): Promise<EvalResult | null> => {
  const client = getSupabase();
  if (!client) return null;

  // Fetch all 56 eval_questions with section info
  const { data: eqs, error: eqErr } = await client
    .from('eval_questions')
    .select('std_point, std_question:questions!eval_questions_stdq_id_fkey(section), cmp_question:questions!eval_questions_cmpq_id_fkey(section)')
    .eq('eval_id', evalId);

  if (eqErr) throw eqErr;
  if (!eqs || eqs.length === 0) throw new Error('문항 데이터가 없습니다.');

  // Accumulate scores per section (1-8)
  const points = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const eq of eqs) {
    const stdSection = (eq.std_question as { section?: number } | null)?.section;
    const cmpSection = (eq.cmp_question as { section?: number } | null)?.section;
    const stdPoint = (eq.std_point as number | null) ?? 0;
    if (stdSection && stdSection >= 1 && stdSection <= 8) points[stdSection - 1] += stdPoint;
    if (cmpSection && cmpSection >= 1 && cmpSection <= 8) points[cmpSection - 1] += (30 - stdPoint);
  }

  // Upsert into results table
  const { data, error } = await client
    .from('results')
    .upsert({
      eval_id: evalId,
      point1: points[0], point2: points[1], point3: points[2], point4: points[3],
      point5: points[4], point6: points[5], point7: points[6], point8: points[7],
    }, { onConflict: 'eval_id' })
    .select()
    .single();

  if (error) throw error;
  return data as EvalResult;
};

/**
 * Get evaluation result
 */
export const getResult = async (evalId: string): Promise<EvalResult | null> => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('results')
    .select('*')
    .eq('eval_id', evalId)
    .single();

  if (error) return null;
  return data as EvalResult;
};

/**
 * Verify payment via Edge Function
 */
export const verifyPayment = async (paymentId: string, purchaseId: string) => {
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
export const validateCoupon = async (code: string) => {
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
export const useCoupon = async (couponId: string, userId: string): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client
    .from('coupons')
    .update({ is_used: true, used_by: userId, used_at: new Date().toISOString() })
    .eq('id', couponId);

  if (error) throw error;
};

/**
 * Get active survey questions for a user group type
 */
export const getActiveSurveyQuestions = async (userGroupName?: string) => {
  const client = getSupabase();
  if (!client) return [];

  const now = new Date().toISOString();
  let query = client
    .from('survey_questions')
    .select('*')
    .lte('start_date', now)
    .gte('end_date', now)
    .order('id');

  if (userGroupName) {
    query = query.or(`target_type.eq.all,target_type.eq.${userGroupName}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Check if survey already completed for an eval
 */
export const checkSurveyCompleted = async (evalId: number): Promise<boolean> => {
  const client = getSupabase();
  if (!client) return false;

  const { count, error } = await client
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('eval_id', evalId);

  if (error) return false;
  return (count || 0) > 0;
};

/**
 * Submit survey response
 */
export const submitSurvey = async (
  evalId: number,
  userId: string,
  responses: { questionId: number; rating: number; comment?: string }[]
): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const rows = responses.map((r) => ({
    eval_id: evalId,
    user_id: userId,
    question_id: r.questionId,
    rating: r.rating,
    comment: r.comment || null,
    created_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from('surveys')
    .insert(rows);

  if (error) throw error;
};

export default getSupabase;
