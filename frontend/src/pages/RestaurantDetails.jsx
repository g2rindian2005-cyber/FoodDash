import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Clock, ShoppingCart, ArrowLeft, Heart } from 'lucide-react';
import Page from '../components/Page';
import FoodCard from '../components/FoodCard';
import ReviewSection from '../components/ReviewSection';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { totals } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorited, setFavorited] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get(`/restaurants/${id}`),
      api.get(`/menu/${id}`),
    ])
      .then(([rRes, mRes]) => {
        if (!active) return;
        setRestaurant(rRes.data);
        setMenu(mRes.data);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  // Check favorite status only when logged in.
  useEffect(() => {
    if (!user) { setFavorited(false); return; }
    let active = true;
    api.get('/favorites')
      .then((res) => { if (active) setFavorited(res.data.some((r) => String(r.id) === String(id))); })
      .catch(() => {});
    return () => { active = false; };
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) { navigate('/login', { state: { from: `/restaurants/${id}` } }); return; }
    setFavBusy(true);
    try {
      if (favorited) {
        await api.delete(`/favorites/${id}`);
        setFavorited(false);
        notify('Removed from favorites', 'info');
      } else {
        await api.post('/favorites', { restaurant_id: Number(id) });
        setFavorited(true);
        notify('Added to favorites', 'success');
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setFavBusy(false);
    }
  };

  // Group menu items by category name
  const grouped = menu.reduce((acc, item) => {
    const key = item.category_name || 'Menu';
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

  if (loading) return <Page><div className="h-96 animate-pulse rounded-2xl bg-gray-100" /></Page>;
  if (error) return <Page><p className="text-red-600">{error}</p></Page>;
  if (!restaurant) return null;

  return (
    <Page className="pb-28">
      <Link to="/restaurants" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to restaurants
      </Link>

      {/* Header */}
      <div className="overflow-hidden rounded-3xl">
        <img src={restaurant.image_url} alt={restaurant.name} className="h-56 w-full object-cover" />
      </div>
      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold">{restaurant.name}</h1>
          <p className="text-gray-500">{restaurant.cuisine}</p>
          <p className="mt-1 text-sm text-gray-500">{restaurant.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-green-600 text-white"><Star className="h-3 w-3 fill-white" /> {restaurant.rating}</span>
          <span className="badge bg-gray-100 text-gray-700"><Clock className="h-3 w-3" /> {restaurant.delivery_time}</span>
          <button
            onClick={toggleFavorite}
            disabled={favBusy}
            className={`btn-outline px-3 py-2 ${favorited ? 'border-brand text-brand' : ''}`}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-brand text-brand' : ''}`} />
          </button>
        </div>
      </div>

      {!restaurant.is_open && (
        <div className="mt-4 rounded-xl bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
          This restaurant is currently closed. You can browse the menu but can't add items.
        </div>
      )}

      {/* Menu */}
      <div className="mt-8 space-y-8">
        {Object.entries(grouped).map(([category, foods]) => (
          <section key={category}>
            <h2 className="mb-4 text-xl font-bold">{category}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {foods.map((item) => (
                <FoodCard key={item.id} item={item} restaurantId={restaurant.id} disabled={!restaurant.is_open} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <ReviewSection restaurantId={id} />

      {/* Sticky cart bar */}
      {totals.count > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-brand px-5 py-3 text-white shadow-xl">
          <span className="font-semibold">{totals.count} item(s) · ₹{totals.subtotal}</span>
          <button onClick={() => navigate('/cart')} className="btn bg-white px-4 py-2 text-brand">
            <ShoppingCart className="h-4 w-4" /> View Cart
          </button>
        </div>
      )}
    </Page>
  );
}
