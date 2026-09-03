import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, UtensilsCrossed, LogOut, LayoutDashboard, User, Heart, PackageSearch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totals } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-brand">
          <UtensilsCrossed className="h-6 w-6" />
          FoodDash
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/restaurants" className="hidden text-sm font-medium text-gray-700 hover:text-brand sm:block">
            Restaurants
          </Link>

          {user?.role === 'owner' && (
            <Link to="/owner" className="btn-outline px-3 py-2 text-sm">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}

          {user && user.role !== 'owner' && (
            <>
              <Link to="/orders" className="hidden rounded-xl p-2 text-gray-700 hover:bg-gray-100 sm:block" title="My Orders">
                <PackageSearch className="h-5 w-5" />
              </Link>
              <Link to="/favorites" className="hidden rounded-xl p-2 text-gray-700 hover:bg-gray-100 sm:block" title="Favorites">
                <Heart className="h-5 w-5" />
              </Link>
            </>
          )}

          <Link to="/cart" className="relative rounded-xl p-2 text-gray-700 hover:bg-gray-100">
            <ShoppingCart className="h-5 w-5" />
            {totals.count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-white">
                {totals.count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1 text-sm font-medium text-gray-700 sm:flex">
                <User className="h-4 w-4" /> {user.name.split(' ')[0]}
              </span>
              <button onClick={handleLogout} className="btn-outline px-3 py-2 text-sm">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-outline px-3 py-2 text-sm">Login</Link>
              <Link to="/signup" className="btn-primary px-3 py-2 text-sm">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
