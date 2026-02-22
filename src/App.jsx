import { lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import GroupGuard from './components/GroupGuard';

// Public pages
import Home from './pages/public/Home';
import Competency from './pages/public/Competency';
import Competency2015 from './pages/public/Competency2015';
import CompetencyNCS from './pages/public/CompetencyNCS';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import InviteRegister from './pages/auth/InviteRegister';
import CompleteProfile from './pages/auth/CompleteProfile';

// User pages
import Main from './pages/user/Main';
import Checkout from './pages/user/Checkout';
import Confirmation from './pages/user/Confirmation';
import Evaluation from './pages/user/Evaluation';
import Result from './pages/user/Result';
import Survey from './pages/user/Survey';
import PrevResult from './pages/user/PrevResult';
import ResultAvg from './pages/user/ResultAvg';
import History from './pages/user/History';
import Profile from './pages/user/Profile';
import DeleteAccount from './pages/user/DeleteAccount';

// Group pages (lazy)
const GroupMain = lazy(() => import('./pages/group/GroupMain'));
const GroupUserList = lazy(() => import('./pages/group/GroupUserList'));
const GroupUserResult = lazy(() => import('./pages/group/GroupUserResult'));
const GroupEvalList = lazy(() => import('./pages/group/GroupEvalList'));
const GroupInvitation = lazy(() => import('./pages/group/GroupInvitation'));
const GroupOrg = lazy(() => import('./pages/group/GroupOrg'));
const GroupManager = lazy(() => import('./pages/group/GroupManager'));
const GroupCouponList = lazy(() => import('./pages/group/GroupCouponList'));
const GroupSettings = lazy(() => import('./pages/group/GroupSettings'));
const GroupStatistics = lazy(() => import('./pages/group/GroupStatistics'));
const GroupUserEvalList = lazy(() => import('./pages/group/GroupUserEvalList'));
const GroupUserInfo = lazy(() => import('./pages/group/GroupUserInfo'));

// Admin pages (lazy)
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const UserList = lazy(() => import('./pages/admin/UserList'));
const UserInfo = lazy(() => import('./pages/admin/UserInfo'));
const QuestionList = lazy(() => import('./pages/admin/QuestionList'));
const QuestionForm = lazy(() => import('./pages/admin/QuestionForm'));
const CouponList = lazy(() => import('./pages/admin/CouponList'));
const Statistics = lazy(() => import('./pages/admin/Statistics'));
const BoardList = lazy(() => import('./pages/admin/BoardList'));
const SurveyList = lazy(() => import('./pages/admin/SurveyList'));
const NoteList = lazy(() => import('./pages/admin/NoteList'));
const SvQuestionList = lazy(() => import('./pages/admin/SvQuestionList'));
const SvQuestionForm = lazy(() => import('./pages/admin/SvQuestionForm'));
const BoardForm = lazy(() => import('./pages/admin/BoardForm'));
const BoardView = lazy(() => import('./pages/admin/BoardView'));
const NoteForm = lazy(() => import('./pages/admin/NoteForm'));
const DeletedUserList = lazy(() => import('./pages/admin/DeletedUserList'));
const EvalManager = lazy(() => import('./pages/admin/EvalManager'));
const MailForm = lazy(() => import('./pages/admin/MailForm'));
const Sources = lazy(() => import('./pages/admin/Sources'));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div className="loading-spinner"></div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page-wrapper">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        padding: '40px 20px',
      }}>
        <h1 style={{ fontSize: '64px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px' }}>404</h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          페이지를 찾을 수 없습니다
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '32px' }}>
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link to="/" className="btn btn-primary">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <a href="#main-content" className="skip-nav">본문으로 건너뛰기</a>
      <Navbar />
      <main id="main-content">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/competency" element={<Competency />} />
          <Route path="/competency/2015" element={<Competency2015 />} />
          <Route path="/competency/ncs" element={<CompetencyNCS />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/invite/:code" element={<InviteRegister />} />
          <Route path="/complete-profile" element={<AuthGuard><CompleteProfile /></AuthGuard>} />

          {/* User (AuthGuard) */}
          <Route path="/main" element={<AuthGuard><Main /></AuthGuard>} />
          <Route path="/checkout" element={<AuthGuard><Checkout /></AuthGuard>} />
          <Route path="/confirmation" element={<AuthGuard><Confirmation /></AuthGuard>} />
          <Route path="/evaluation/:evalId" element={<AuthGuard><Evaluation /></AuthGuard>} />
          <Route path="/result/:evalId" element={<AuthGuard><Result /></AuthGuard>} />
          <Route path="/survey/:evalId" element={<AuthGuard><Survey /></AuthGuard>} />
          <Route path="/results" element={<AuthGuard><PrevResult /></AuthGuard>} />
          <Route path="/results/average" element={<AuthGuard><ResultAvg /></AuthGuard>} />
          <Route path="/history" element={<AuthGuard><History /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/delete-account" element={<AuthGuard><DeleteAccount /></AuthGuard>} />

          {/* Group (GroupGuard) */}
          <Route path="/group" element={<GroupGuard><GroupMain /></GroupGuard>} />
          <Route path="/group/users" element={<GroupGuard><GroupUserList /></GroupGuard>} />
          <Route path="/group/users/:id/result" element={<GroupGuard><GroupUserResult /></GroupGuard>} />
          <Route path="/group/evals" element={<GroupGuard><GroupEvalList /></GroupGuard>} />
          <Route path="/group/invite" element={<GroupGuard><GroupInvitation /></GroupGuard>} />
          <Route path="/group/org" element={<GroupGuard><GroupOrg /></GroupGuard>} />
          <Route path="/group/manager" element={<GroupGuard><GroupManager /></GroupGuard>} />
          <Route path="/group/users/:userId/info" element={<GroupGuard><GroupUserInfo /></GroupGuard>} />
          <Route path="/group/users/:userId/evals" element={<GroupGuard><GroupUserEvalList /></GroupGuard>} />
          <Route path="/group/coupons" element={<GroupGuard><GroupCouponList /></GroupGuard>} />
          <Route path="/group/statistics" element={<GroupGuard><GroupStatistics /></GroupGuard>} />
          <Route path="/group/settings" element={<GroupGuard><GroupSettings /></GroupGuard>} />

          {/* Admin (AdminGuard) */}
          <Route path="/admin" element={<AdminGuard><Dashboard /></AdminGuard>} />
          <Route path="/admin/users" element={<AdminGuard><UserList /></AdminGuard>} />
          <Route path="/admin/users/:id" element={<AdminGuard><UserInfo /></AdminGuard>} />
          <Route path="/admin/questions" element={<AdminGuard><QuestionList /></AdminGuard>} />
          <Route path="/admin/questions/new" element={<AdminGuard><QuestionForm /></AdminGuard>} />
          <Route path="/admin/questions/:questionId/edit" element={<AdminGuard><QuestionForm /></AdminGuard>} />
          <Route path="/admin/results/:evalId" element={<AdminGuard><Result /></AdminGuard>} />
          <Route path="/admin/coupons" element={<AdminGuard><CouponList /></AdminGuard>} />
          <Route path="/admin/statistics" element={<AdminGuard><Statistics /></AdminGuard>} />
          <Route path="/admin/board" element={<AdminGuard><BoardList /></AdminGuard>} />
          <Route path="/admin/surveys" element={<AdminGuard><SurveyList /></AdminGuard>} />
          <Route path="/admin/notes" element={<AdminGuard><NoteList /></AdminGuard>} />
          <Route path="/admin/notes/new" element={<AdminGuard><NoteForm /></AdminGuard>} />
          <Route path="/admin/notes/:id/edit" element={<AdminGuard><NoteForm /></AdminGuard>} />
          <Route path="/admin/survey-questions" element={<AdminGuard><SvQuestionList /></AdminGuard>} />
          <Route path="/admin/survey-questions/new" element={<AdminGuard><SvQuestionForm /></AdminGuard>} />
          <Route path="/admin/survey-questions/:id/edit" element={<AdminGuard><SvQuestionForm /></AdminGuard>} />
          <Route path="/admin/board/new" element={<AdminGuard><BoardForm /></AdminGuard>} />
          <Route path="/admin/board/:id" element={<AdminGuard><BoardView /></AdminGuard>} />
          <Route path="/admin/board/:id/edit" element={<AdminGuard><BoardForm /></AdminGuard>} />
          <Route path="/admin/deleted-users" element={<AdminGuard><DeletedUserList /></AdminGuard>} />
          <Route path="/admin/users/:userId/evals" element={<AdminGuard><EvalManager /></AdminGuard>} />
          <Route path="/admin/mail" element={<AdminGuard><MailForm /></AdminGuard>} />
          <Route path="/admin/sources" element={<AdminGuard><Sources /></AdminGuard>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </main>
      <Footer />
    </>
  );
}

export default App;
