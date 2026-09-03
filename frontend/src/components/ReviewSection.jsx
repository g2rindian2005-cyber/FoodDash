import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ReviewSection({ restaurantId }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avg_rating: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get(`/reviews/${restaurantId}`)
      .then((res) => { setReviews(res.data.reviews); setSummary(res.data.summary); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [restaurantId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return notify('Log in to leave a review.', 'info');
    setSubmitting(true);
    try {
      await api.post('/reviews', { restaurant_id: Number(restaurantId), rating, comment });
      setComment('');
      setRating(5);
      notify('Thanks for your review!', 'success');
      load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-xl font-bold">Ratings &amp; Reviews</h2>
      <p className="mb-4 text-sm text-gray-500">
        {summary.total > 0
          ? `${summary.avg_rating} average from ${summary.total} review${summary.total == 1 ? '' : 's'}`
          : 'No reviews yet — be the first!'}
      </p>

      <form onSubmit={submit} className="card mb-6 p-4">
        <div className="mb-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
        <textarea
          className="input min-h-[80px] resize-none"
          placeholder={user ? 'Share your experience…' : 'Log in to leave a review'}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!user}
        />
        <button type="submit" disabled={submitting || !user} className="btn-primary mt-3 px-5 py-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post review'}
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.user_name}</span>
                <span className="flex items-center gap-1 text-sm text-yellow-600">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {r.rating}
                </span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
