import { faDog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, isAuthenticated, logout, logoutLoading  } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <Link to="/dashboard" className="btn btn-ghost text-xl">
          <FontAwesomeIcon icon={faDog} size='sm' />
          Woof Searcher
        </Link>
      </div>
      <div className="flex gap-2">
        {isAuthenticated &&
          <div className="dropdown dropdown-end flex justify-center items-center gap-4">
            <div>Welcome: {user?.firstName} {user?.lastName} - {user?.email}</div>
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="Profile Picture"
                  src={user?.image} />
              </div>
            </div>
            <ul
              tabIndex={-1}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
              <li>
                <Link to="/favorites" className='text-sm'>
                  Favorites
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className='text-sm hover:bg-transparent! hover:text-current!'
                >
                  {logoutLoading ? "Logging out..." : "Logout"}
                </button>
              </li>
            </ul>
          </div>
        }
      </div>
    </div>
  );
}
