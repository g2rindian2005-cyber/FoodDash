import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChefHat, Bike, PackageCheck, Receipt, PhoneCall, AlertCircle } from 'lucide-react';
import Page from '../components/Page';
import api from '../api/axios';

const STAGES = [
  { key: 'confirmed', label: 'Order confirmed', desc: 'Restaurant accepted your order.', icon: Receipt },
  { key: 'preparing', label: 'Preparing your food', desc: 'The kitchen is cooking your meal.', icon: ChefHat },
  { key: 'out_for_delivery', label: 'Out for delivery', desc: 'Your rider is on the way.', icon: Bike },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your meal!', icon: PackageCheck },
];
const STAGE_KEYS = STAGES.map((s) => s.key);
const ETA_TEXT = ['Confirming your order…', 'Ready in ~15 min', 'Arriving in ~10 min', 'Delivered'];

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const pollRef = useRef(null);
  const failCountRef = useRef(0);

  // Fetch full order details once (restaurant name, total, items, etc).
  useEffect(() => {
    let active = true;
    api.get(`/orders/${id}`)
      .then((res) => {
        if (!active) return;
        setOrder(res.data);
        const idx = STAGE_KEYS.indexOf(res.data.status);
        if (idx >= 0) setStage(idx);
      })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id]);

  // Poll the lightweight status endpoint every 4s so the tracker reflects
  // real backend state (the API auto-advances orders through the stages).
  // If the backend is unreachable, fall back to a local simulated timer so
  // the page still progresses and never looks "stuck" or broken.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await api.get(`/orders/${id}/status`);
        if (cancelled) return;
        failCountRef.current = 0;
        setOffline(false);
        const idx = STAGE_KEYS.indexOf(res.data.status);
        if (idx >= 0) setStage(idx);
      } catch (err) {
        failCountRef.current += 1;
        if (failCountRef.current >= 2 && !cancelled) {
          setOffline(true); // switch to local simulation below
        }
      }
    };

    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => { cancelled = true; clearInterval(pollRef.current); };
  }, [id]);

  // Local fallback simulation — only runs once we've decided the backend
  // is unreachable, so the demo still works end-to-end offline.
  useEffect(() => {
    if (!offline || stage >= STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4000);
    return () => clearTimeout(t);
  }, [offline, stage]);

  const delivered = stage >= STAGES.length - 1;

  return (
    <Page className="max-w-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Tracking order #{id}</h1>
        <span className="badge bg-brand/10 text-brand">{ETA_TEXT[stage]}</span>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {order && (
        <p className="mb-6 text-gray-500">
          {order.restaurant_name ? `From ${order.restaurant_name} · ` : ''}Total ₹{order.total}
        </p>
      )}

      {offline && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Can't reach the server right now, so we're showing simulated progress. Check that the backend API is
          running and reachable (see the README's Troubleshooting section).
        </div>
      )}

      <div className="card p-6">
        <ol className="relative space-y-8 border-l-2 border-dashed border-gray-200 pl-8">
          {STAGES.map((s, idx) => {
            const done = idx <= stage;
            const active = idx === stage;
            const Icon = s.icon;
            return (
              <li key={s.key} className="relative">
                <span
                  className={`absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full ${
                    done ? 'bg-brand text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {done && !active ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </span>
                <motion.div animate={{ opacity: done ? 1 : 0.5 }}>
                  <h3 className={`font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                    {active && !delivered && (
                      <span className="ml-2 inline-block animate-pulse text-xs text-brand">in progress…</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
        <PhoneCall className="h-4 w-4" /> Need help? <Link to="/restaurants" className="font-medium text-brand hover:underline">Contact support</Link>
      </div>

      <button
        onClick={() => navigate(`/delivered/${id}`)}
        disabled={!delivered}
        className="btn-primary mt-6 w-full py-3"
      >
        {delivered ? 'View delivery summary' : 'Waiting for delivery…'}
      </button>
    </Page>
  );
}
