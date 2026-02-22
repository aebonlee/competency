// ============================================================
// MyCoreCompetency — 핵심 타입 정의
// ============================================================

// ---- User & Auth ----
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  age?: string;
  gender?: string;
  country?: string;
  position?: string;
  school?: string;
  usertype: 0 | 1 | 2 | 3; // 0=개인, 1=그룹, 2=관리자, 3=서브관리자
  group_id?: string;
  subgrp?: string;
  created_at: string;
  deleted_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

// ---- Evaluation ----
export interface EvalItem {
  id: string;
  user_id: string;
  eval_type?: number;
  times: number;
  progress: number;
  start_date?: string;
  created_at: string;
  end_date?: string;
  results?: { id: string }[];
}

export interface EvalQuestion {
  id: string;
  eval_id: string;
  pair_index: number;
  std_question_id: string;
  cmp_question_id: string;
  std_point?: number;
  std_question?: Question;
  cmp_question?: Question;
}

export interface Question {
  id: string;
  area: number; // 1~8
  number: number;
  content: string;
}

export interface EvalResult {
  id: string;
  eval_id: string;
  point1: number;
  point2: number;
  point3: number;
  point4: number;
  point5: number;
  point6: number;
  point7: number;
  point8: number;
}

// ---- Group ----
export interface Group {
  id: string;
  name: string;
  org?: string;
  description?: string;
  owner_id: string;
  group_type?: string;
  max_members?: number;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  joined_at: string;
  profiles?: Pick<UserProfile, 'name' | 'email' | 'phone' | 'subgrp'>;
}

export interface GroupManager {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  assigned_at: string;
  profiles?: Pick<UserProfile, 'name' | 'email'>;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  email: string;
  invited_by?: string;
  status: string;
  created_at: string;
}

export interface GroupSubgroup {
  id: string;
  group_id: string;
  name: string;
  sort_order: number;
}

// ---- Commerce ----
export interface Purchase {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id?: string;
  paid_at?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  group_id?: string;
  created_by?: string;
  is_used: boolean;
  used_by?: string;
  used_at?: string;
  created_at: string;
}

// ---- Content ----
export interface BoardPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  author_id: string;
  views: number;
  created_at: string;
  updated_at?: string;
}

export interface Note {
  id: string;
  title?: string;
  content: string;
  sender_id: string;
  receiver_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Survey {
  id: string;
  eval_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// ---- Competency ----
export type CompetencyArea = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CompetencyInfo {
  id: CompetencyArea;
  name: string;
  color: string;
  description: string;
}

// ---- Utils ----
export interface PaymentRequest {
  orderId: string;
  orderName: string;
  totalAmount: number;
  payMethod: string;
  customer: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
}

export interface PaymentResult {
  paymentId?: string;
  txId?: string;
  code?: string;
  message?: string;
}
