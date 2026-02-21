import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';

const OrgNode = ({ node }) => {
  return (
    <div className="org-node">
      <div className="org-node-box">
        <div style={{ fontWeight: 700 }}>{node.name}</div>
        {node.title && (
          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
            {node.title}
          </div>
        )}
      </div>
      {node.children && node.children.length > 0 && (
        <div className="org-children">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const GroupOrg = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orgTree, setOrgTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user) {
          setLoading(false);
          return;
        }

        // Get group
        const { data: group } = await supabase
          .from('groups')
          .select('id, name, org')
          .eq('owner_id', user.id)
          .single();

        if (!group) {
          setLoading(false);
          return;
        }

        // Get org structure (departments/sub-groups)
        const { data: orgData, error } = await supabase
          .from('group_org')
          .select('*')
          .eq('group_id', group.id)
          .order('sort_order', { ascending: true });

        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          throw error;
        }

        // Build tree from flat data
        const nodes = orgData || [];
        const nodeMap = {};
        const roots = [];

        // If no org data, build a basic structure from the group itself
        if (nodes.length === 0) {
          setOrgTree({
            id: group.id,
            name: group.name || group.org || '그룹',
            title: '그룹 관리자',
            children: [],
          });
        } else {
          nodes.forEach((node) => {
            nodeMap[node.id] = {
              id: node.id,
              name: node.name,
              title: node.title || '',
              children: [],
            };
          });

          nodes.forEach((node) => {
            if (node.parent_id && nodeMap[node.parent_id]) {
              nodeMap[node.parent_id].children.push(nodeMap[node.id]);
            } else {
              roots.push(nodeMap[node.id]);
            }
          });

          setOrgTree(
            roots.length === 1
              ? roots[0]
              : {
                  id: group.id,
                  name: group.name || '그룹',
                  title: '',
                  children: roots,
                }
          );
        }
      } catch (err) {
        console.error('Failed to load org chart:', err);
        showToast('조직도를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [user, showToast]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>조직도</h1></div>
      </section>

      <div className="group-page">
      <div className="group-header-bar">
        <Link to="/group" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      {!orgTree ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-light)' }}>
            등록된 조직 정보가 없습니다.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="org-chart" style={{ display: 'flex', justifyContent: 'center' }}>
            <OrgNode node={orgTree} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default GroupOrg;
