import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <header className="topbar">
        <strong className="brand">Sweety</strong>
        <nav>
          <NavLink to="/" end>Readings</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </nav>
        <div className="user">
          <span>{user.name}</span>
          <button type="button" className="link" onClick={onLogout}>Log out</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
