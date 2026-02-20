import { Routes, Route } from 'react-router-dom';
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

// User pages
import Main from './pages/user/Main';
import Checkout from './pages/user/Checkout';
import Confirmation from './pages/user/Confirmation';
import Evaluation from './pages/user/Evaluation';
import Result from './pages/user/Result';
import PrevResult from './pages/user/PrevResult';
import ResultAvg from './pages/user/ResultAvg';
import History from './pages/user/History';
import Profile from './pages/user/Profile';
import DeleteAccount from './pages/user/DeleteAccount';

// Group pages
import GroupMain from './pages/group/GroupMain';
import GroupUserList from './pages/group/GroupUserList';
import GroupUserResult from './pages/group/GroupUserResult';
import GroupEvalList from './pages/group/GroupEvalList';
import GroupInvitation from './pages/group/GroupInvitation';
import GroupOrg from './pages/group/GroupOrg';
import GroupManager from './pages/group/GroupManager';
import GroupCouponList from './pages/group/GroupCouponList';
import GroupSettings from './pages/group/GroupSettings';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import UserList from './pages/admin/UserList';
import UserInfo from './pages/admin/UserInfo';
import QuestionList from './pages/admin/QuestionList';
import QuestionForm from './pages/admin/QuestionForm';
import CouponList from './pages/admin/CouponList';
import Statistics from './pages/admin/Statistics';
import BoardList from './pages/admin/BoardList';
import SurveyList from './pages/admin/SurveyList';
import NoteList from './pages/admin/NoteList';

function App() {
  return (
    <>
      <Navbar />
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

        {/* User (AuthGuard) */}
        <Route path="/main" element={<AuthGuard><Main /></AuthGuard>} />
        <Route path="/checkout" element={<AuthGuard><Checkout /></AuthGuard>} />
        <Route path="/confirmation" element={<AuthGuard><Confirmation /></AuthGuard>} />
        <Route path="/evaluation/:evalId" element={<AuthGuard><Evaluation /></AuthGuard>} />
        <Route path="/result/:evalId" element={<AuthGuard><Result /></AuthGuard>} />
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
        <Route path="/group/coupons" element={<GroupGuard><GroupCouponList /></GroupGuard>} />
        <Route path="/group/settings" element={<GroupGuard><GroupSettings /></GroupGuard>} />

        {/* Admin (AdminGuard) */}
        <Route path="/admin" element={<AdminGuard><Dashboard /></AdminGuard>} />
        <Route path="/admin/users" element={<AdminGuard><UserList /></AdminGuard>} />
        <Route path="/admin/users/:id" element={<AdminGuard><UserInfo /></AdminGuard>} />
        <Route path="/admin/questions" element={<AdminGuard><QuestionList /></AdminGuard>} />
        <Route path="/admin/questions/new" element={<AdminGuard><QuestionForm /></AdminGuard>} />
        <Route path="/admin/coupons" element={<AdminGuard><CouponList /></AdminGuard>} />
        <Route path="/admin/statistics" element={<AdminGuard><Statistics /></AdminGuard>} />
        <Route path="/admin/board" element={<AdminGuard><BoardList /></AdminGuard>} />
        <Route path="/admin/surveys" element={<AdminGuard><SurveyList /></AdminGuard>} />
        <Route path="/admin/notes" element={<AdminGuard><NoteList /></AdminGuard>} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
