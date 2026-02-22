import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GROUP_TYPES = [
  { value: 'company', label: '기업' },
  { value: 'university', label: '대학' },
  { value: 'institution', label: '기관' },
  { value: 'other', label: '기타' },
];

const GroupSettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState(null);
  const [form, setForm] = useState({
    group_name: '',
    org_name: '',
    description: '',
    group_type: 'other',
    max_members: 100,
    contact_phone: '',
    contact_email: '',
    website: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Subgroup state
  const [subgroups, setSubgroups] = useState([]);
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [editingSubgroupId, setEditingSubgroupId] = useState(null);
  const [editingSubgroupName, setEditingSubgroupName] = useState('');
  const [subgroupSaving, setSubgroupSaving] = useState(false);

  // Logo preview
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user) {
          setLoading(false);
          return;
        }

        const { data: group, error } = await supabase
          .from('groups')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (group) {
          setGroupId(group.id);
          setForm({
            group_name: group.name || '',
            org_name: group.org || '',
            description: group.description || '',
            group_type: group.group_type || 'other',
            max_members: group.max_members || 100,
            contact_phone: group.contact_phone || '',
            contact_email: group.contact_email || '',
            website: group.website || '',
            logo_url: group.logo_url || '',
          });

          // Fetch subgroups
          const { data: subs } = await supabase
            .from('group_subgroups')
            .select('*')
            .eq('group_id', group.id)
            .order('sort_order', { ascending: true });

          setSubgroups(subs || []);
        }
      } catch (err) {
        console.error('Failed to load group settings:', err);
        showToast('그룹 설정을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [user, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'logo_url') setLogoError(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupId || !form.group_name.trim()) {
      showToast('그룹명을 입력해 주세요.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('groups')
        .update({
          name: form.group_name.trim(),
          org: form.org_name.trim(),
          description: form.description.trim(),
          group_type: form.group_type,
          max_members: parseInt(form.max_members) || 100,
          contact_phone: form.contact_phone.trim(),
          contact_email: form.contact_email.trim(),
          website: form.website.trim(),
          logo_url: form.logo_url.trim(),
        })
        .eq('id', groupId);

      if (error) throw error;

      showToast('그룹 설정이 저장되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to save group settings:', err);
      showToast('설정 저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Subgroup CRUD
  const handleAddSubgroup = async () => {
    if (!newSubgroupName.trim() || !groupId) return;
    setSubgroupSaving(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('group_subgroups')
        .insert({
          group_id: groupId,
          name: newSubgroupName.trim(),
          sort_order: subgroups.length,
        })
        .select()
        .single();

      if (error) throw error;

      setSubgroups((prev) => [...prev, data]);
      setNewSubgroupName('');
      showToast('서브그룹이 추가되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to add subgroup:', err);
      showToast('서브그룹 추가에 실패했습니다.', 'error');
    } finally {
      setSubgroupSaving(false);
    }
  };

  const handleUpdateSubgroup = async (id) => {
    if (!editingSubgroupName.trim()) return;
    setSubgroupSaving(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('group_subgroups')
        .update({ name: editingSubgroupName.trim() })
        .eq('id', id);

      if (error) throw error;

      setSubgroups((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: editingSubgroupName.trim() } : s))
      );
      setEditingSubgroupId(null);
      setEditingSubgroupName('');
      showToast('서브그룹이 수정되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to update subgroup:', err);
      showToast('서브그룹 수정에 실패했습니다.', 'error');
    } finally {
      setSubgroupSaving(false);
    }
  };

  const handleDeleteSubgroup = async (id) => {
    if (!window.confirm('이 서브그룹을 삭제하시겠습니까?')) return;
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('group_subgroups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubgroups((prev) => prev.filter((s) => s.id !== id));
      showToast('서브그룹이 삭제되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to delete subgroup:', err);
      showToast('서브그룹 삭제에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;

    const confirmText = window.prompt(
      '그룹을 삭제하면 모든 멤버와 데이터가 삭제됩니다.\n삭제하려면 그룹명을 입력하세요:'
    );

    if (confirmText !== form.group_name) {
      if (confirmText !== null) {
        showToast('그룹명이 일치하지 않습니다.', 'warning');
      }
      return;
    }

    setDeleting(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId);

      await supabase
        .from('group_invitations')
        .delete()
        .eq('group_id', groupId);

      await supabase
        .from('group_managers')
        .delete()
        .eq('group_id', groupId);

      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      showToast('그룹이 삭제되었습니다.', 'success');
      navigate('/');
    } catch (err) {
      console.error('Failed to delete group:', err);
      showToast('그룹 삭제에 실패했습니다.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!groupId) {
    return (
      <div className="page-wrapper">
        <section className="page-header">
          <div className="container"><h1>그룹 설정</h1></div>
        </section>
        <div className="group-page">
          <div className="card text-center" style={{ padding: '60px 20px' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-light)' }}>
              등록된 그룹이 없습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>그룹 설정</h1></div>
      </section>

      <div className="group-page">
      <div className="group-header-bar">
        <Link to="/group" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      <form onSubmit={handleSave}>
        {/* Section A: 기본 정보 */}
        <div className="card mb-3">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
            기본 정보
          </h3>
          <div className="form-group">
            <label htmlFor="group_name">그룹명 *</label>
            <input
              id="group_name"
              name="group_name"
              type="text"
              value={form.group_name}
              onChange={handleChange}
              placeholder="그룹명을 입력하세요"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="org_name">기관/조직명</label>
            <input
              id="org_name"
              name="org_name"
              type="text"
              value={form.org_name}
              onChange={handleChange}
              placeholder="기관 또는 조직명을 입력하세요"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">그룹 설명</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              placeholder="그룹에 대한 간략한 설명을 입력하세요"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="group_type">그룹 유형</label>
              <select
                id="group_type"
                name="group_type"
                value={form.group_type}
                onChange={handleChange}
              >
                {GROUP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="max_members">최대 인원</label>
              <input
                id="max_members"
                name="max_members"
                type="number"
                min="1"
                value={form.max_members}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section B: 연락처 정보 */}
        <div className="card mb-3">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
            연락처 정보
          </h3>
          <div className="form-group">
            <label htmlFor="contact_phone">연락처 전화번호</label>
            <input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              value={form.contact_phone}
              onChange={handleChange}
              placeholder="02-1234-5678"
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact_email">연락처 이메일</label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              value={form.contact_email}
              onChange={handleChange}
              placeholder="contact@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="website">웹사이트</label>
            <input
              id="website"
              name="website"
              type="url"
              value={form.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Section C: 브랜딩 */}
        <div className="card mb-3">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
            브랜딩
          </h3>
          <div className="form-group">
            <label htmlFor="logo_url">로고 URL</label>
            <input
              id="logo_url"
              name="logo_url"
              type="url"
              value={form.logo_url}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
            />
          </div>
          {form.logo_url && !logoError && (
            <div className="group-logo-preview">
              <img
                src={form.logo_url}
                alt="로고 미리보기"
                onError={() => setLogoError(true)}
              />
            </div>
          )}
          {logoError && (
            <p style={{ fontSize: '13px', color: 'var(--accent-red)', marginTop: '8px' }}>
              로고 이미지를 불러올 수 없습니다. URL을 확인해 주세요.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </form>

      {/* Section D: 서브그룹 관리 */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
          서브그룹 관리
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          부서, 학과, 팀 등 하위 그룹을 관리합니다.
        </p>

        {subgroups.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
            등록된 서브그룹이 없습니다.
          </div>
        ) : (
          <div className="subgroup-list">
            {subgroups.map((sg) => (
              <div key={sg.id} className="subgroup-item">
                {editingSubgroupId === sg.id ? (
                  <>
                    <input
                      type="text"
                      value={editingSubgroupName}
                      onChange={(e) => setEditingSubgroupName(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border-medium)', borderRadius: '4px', fontSize: '14px' }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateSubgroup(sg.id); }}
                    />
                    <div className="subgroup-item-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdateSubgroup(sg.id)}
                        disabled={subgroupSaving}
                      >
                        저장
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setEditingSubgroupId(null); setEditingSubgroupName(''); }}
                      >
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="subgroup-item-name">{sg.name}</span>
                    <div className="subgroup-item-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setEditingSubgroupId(sg.id); setEditingSubgroupName(sg.name); }}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteSubgroup(sg.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="subgroup-add-form">
          <input
            type="text"
            value={newSubgroupName}
            onChange={(e) => setNewSubgroupName(e.target.value)}
            placeholder="새 서브그룹 이름"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubgroup(); } }}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAddSubgroup}
            disabled={subgroupSaving || !newSubgroupName.trim()}
          >
            {subgroupSaving ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>

      {/* Section E: 위험 영역 */}
      <div className="card" style={{ borderColor: 'var(--accent-red)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-red)' }}>
          위험 영역
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          그룹을 삭제하면 모든 멤버 정보, 초대 내역, 관리자 정보가 영구적으로 삭제됩니다.
          이 작업은 되돌릴 수 없습니다.
        </p>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '삭제 중...' : '그룹 삭제'}
        </button>
      </div>
      </div>
    </div>
  );
};

export default GroupSettings;
