import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GroupSettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState(null);
  const [form, setForm] = useState({
    group_name: '',
    org_name: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
          });
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

      // Delete group members first
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId);

      // Delete group invitations
      await supabase
        .from('group_invitations')
        .delete()
        .eq('group_id', groupId);

      // Delete group managers
      await supabase
        .from('group_managers')
        .delete()
        .eq('group_id', groupId);

      // Delete the group itself
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

      {/* Settings Form */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
          기본 정보
        </h3>
        <form onSubmit={handleSave}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
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
