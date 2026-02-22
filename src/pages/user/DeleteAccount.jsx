import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { deleteAccount } from '../../utils/auth';

const DeleteAccount = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirm !== '회원탈퇴') return;
    setLoading(true);
    try {
      await deleteAccount(user.id);
      showToast('회원탈퇴가 완료되었습니다.', 'info');
      navigate('/');
    } catch {
      showToast('회원탈퇴에 실패했습니다.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <section className="page-header-danger">
        <div className="container"><h1>회원탈퇴</h1></div>
      </section>

      <section className="section-content">
        <div className="container-xs">
          <div className="card">
            <h3 className="delete-title">정말 탈퇴하시겠습니까?</h3>
            <p className="delete-desc">
              회원탈퇴 시 모든 검사 결과 및 개인 데이터가 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
            <p className="delete-hint">
              탈퇴를 진행하려면 아래에 &quot;회원탈퇴&quot;를 입력해주세요.
            </p>
            <div className="form-group">
              <input type="text" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder='"회원탈퇴" 입력' />
            </div>
            <button className="btn btn-danger btn-full" onClick={handleDelete} disabled={confirm !== '회원탈퇴' || loading}>
              {loading ? '처리 중...' : '회원탈퇴'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeleteAccount;
