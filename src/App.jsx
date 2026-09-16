import { Routes, Route, Outlet } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { CustomerLayout } from './layouts/CustomerLayout.jsx';
import { Home } from './pages/public/Home.jsx';
import { NotFound } from './pages/public/NotFound.jsx';
import { AdminHome } from './pages/admin/AdminHome.jsx';
import { AdminLogin } from './pages/admin/AdminLogin.jsx';
import { AdminProjects } from './pages/admin/AdminProjects.jsx';
import { AdminOrders } from './pages/admin/AdminOrders.jsx';
import { AdminMessages } from './pages/admin/AdminMessages.jsx';
import { AdminVisitors } from './pages/admin/AdminVisitors.jsx';
import { VisitorDetail } from './pages/admin/VisitorDetail.jsx';
import { AdminAnalytics } from './pages/admin/AdminAnalytics.jsx';
import { AdminProfile } from './pages/admin/AdminProfile.jsx';
import { AdminFeedback } from './pages/admin/AdminFeedback.jsx';
import { AdminTeam } from './pages/admin/AdminTeam.jsx';
import { TrackOrder } from './pages/customer/TrackOrder.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute.jsx';
import { usePageViewTracking } from './hooks/usePageViewTracking.js';
import { useEngagementTracking } from './hooks/useEngagementTracking.js';

export default function App() {
  // Called once, at the top of the whole route tree, so every route
  // change anywhere in the app (not just inside PublicLayout) is seen —
  // the hook itself filters out /admin/* paths, see
  // hooks/usePageViewTracking.js.
  usePageViewTracking();
  // Active time-on-page engagement (PARTS 2-6). Same placement/reasoning
  // as usePageViewTracking above — one call, top of the route tree, and
  // the hook itself excludes /admin/* paths.
  useEngagementTracking();

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* Single AdminAuthProvider covers both /admin/login and /admin/*
          so there's one session subscription, not one per route. */}
      <Route element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="visitors" element={<AdminVisitors />} />
          <Route path="visitors/:visitorId" element={<VisitorDetail />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="team" element={<AdminTeam />} />
        </Route>
      </Route>

      <Route path="/track" element={<CustomerLayout />}>
        <Route index element={<TrackOrder />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
