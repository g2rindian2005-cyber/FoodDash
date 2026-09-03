import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartOff, Heart } from 'lucide-react';
import Page from '../components/Page';
import RestaurantCard from '../components/RestaurantCard';
import api from '../api/axios';

export default function Favorites() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/favorites')
      .then((res) => setRestaurants(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page>
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-extrabold">
        <Heart className="h-7 w-7 fill-brand text-brand" /> Your Favorites
      </h1>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-72 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="card p-12 text-center">
          <HeartOff className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-bold">No favorites yet</h2>
          <p className="mt-1 text-gray-500">Tap the heart on any restaurant to save it here.</p>
          <Link to="/restaurants" className="btn-primary mt-6 inline-flex px-6 py-3">Browse restaurants</Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </Page>
  );
}
