import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../components/navigation/PublicNavbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { useProfile } from '../hooks/useProfile.js';

export function PublicLayout() {
  const profileState = useProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet context={profileState} />
      </main>
      <Footer profile={profileState.profile} />
    </div>
  );
}
