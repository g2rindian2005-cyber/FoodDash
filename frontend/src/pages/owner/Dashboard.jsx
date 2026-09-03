import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, IndianRupee, Clock, CheckCircle2,
  UtensilsCrossed, ClipboardList, Store, Tag, Power, Plus, Trash2,
} from 'lucide-react';
import Page from '../../components/Page';
import api from '../../api/axios';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'restaurant', label: 'Restaurant', icon: Store },
];

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OwnerDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState('');

  const loadCore = useCallback(() => {
    Promise.all([api.get('/owner/stats'), api.get('/owner/restaurant')])
      .then(([s, r]) => { setStats(s.data); setRestaurant(r.data); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => { loadCore(); }, [loadCore]);

  return (
    <Page>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Owner Dashboard</h1>
          <p className="text-sm text-gray-500">{restaurant?.name || 'Your restaurant'}</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn px-4 py-2 text-sm ${
              tab === t.id ? 'bg-brand text-white' : 'border border-gray-200 bg-white text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview stats={stats} />}
      {tab === 'orders' && <Orders />}
      {tab === 'menu' && <Menu restaurant={restaurant} />}
      {tab === 'restaurant' && (
        <RestaurantSettings restaurant={restaurant} onSaved={(r) => { setRestaurant(r); loadCore(); }} />
      )}
    </Page>
  );
}

/* ---------------------------------------------------------------- Overview */
function Overview({ stats }) {
  const cards = [
    { label: "Today's Orders", value: stats?.todaysOrders ?? '—', icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Revenue', value: stats ? `₹${stats.revenue.toLocaleString('en-IN')}` : '—', icon: IndianRupee, color: 'bg-green-500' },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? '—', icon: Clock, color: 'bg-orange-500' },
    { label: 'Completed Orders', value: stats?.completedOrders ?? '—', icon: CheckCircle2, color: 'bg-purple-500' },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card p-6"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${c.color}`}>
            <c.icon className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-gray-500">{c.label}</p>
          <p className="text-3xl font-extrabold">{c.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Orders */
function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const load = () => api.get('/orders').then((r) => setOrders(r.data)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      load();
    } catch (e) { setError(e.message); }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (orders.length === 0) return <p className="text-gray-500">No orders yet.</p>;

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-3 font-semibold">#{o.id}</td>
              <td className="px-4 py-3">{o.customer_name || '—'}</td>
              <td className="px-4 py-3">₹{o.total}</td>
              <td className="px-4 py-3">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------- Menu */
function Menu({ restaurant }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', price: '', description: '', image_url: '', is_veg: true });

  const load = useCallback(() => {
    if (!restaurant) return;
    api.get(`/menu/${restaurant.id}`).then((r) => setItems(r.data)).catch((e) => setError(e.message));
  }, [restaurant]);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/menu', {
        restaurant_id: restaurant.id,
        name: form.name,
        price: Number(form.price),
        description: form.description,
        image_url: form.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
        is_veg: form.is_veg,
      });
      setForm({ name: '', price: '', description: '', image_url: '', is_veg: true });
      load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`/menu/${id}`); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Add form */}
      <form onSubmit={add} className="card h-fit space-y-3 p-5">
        <h3 className="flex items-center gap-2 font-bold"><Plus className="h-4 w-4" /> Add food item</h3>
        <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Price" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" placeholder="Image URL (optional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_veg} onChange={(e) => setForm({ ...form, is_veg: e.target.checked })} className="accent-brand" />
          Vegetarian
        </label>
        <button className="btn-primary w-full py-2.5">Add item</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {/* Item list */}
      <div className="space-y-3 lg:col-span-2">
        {items.length === 0 && <p className="text-gray-500">No menu items yet. Add one on the left.</p>}
        {items.map((it) => (
          <div key={it.id} className="card flex items-center gap-4 p-4">
            <img src={it.image_url} alt={it.name} className="h-14 w-14 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-semibold">{it.name}</p>
              <p className="text-sm text-gray-500">₹{it.price} · {it.category_name || 'Menu'}</p>
            </div>
            <button onClick={() => remove(it.id)} className="text-gray-400 hover:text-red-600">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------- Restaurant tab */
function RestaurantSettings({ restaurant, onSaved }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (restaurant) setForm(restaurant); }, [restaurant]);
  if (!form) return <p className="text-gray-500">Loading…</p>;

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError(''); setSaved(false);
    try {
      const res = await api.put(`/restaurants/${form.id}`, {
        name: form.name, description: form.description, cuisine: form.cuisine,
        image_url: form.image_url, delivery_time: form.delivery_time,
        price_for_two: Number(form.price_for_two), address: form.address,
        offer_text: form.offer_text,
      });
      onSaved(res.data);
      setSaved(true);
    } catch (e) { setError(e.message); }
  };

  const toggleOpen = async () => {
    try {
      const res = await api.patch(`/restaurants/${form.id}/status`, { is_open: !form.is_open });
      setForm(res.data);
      onSaved(res.data);
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Open / close + offers */}
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-bold"><Power className="h-4 w-4" /> Opening status</h3>
          <p className="mt-1 text-sm text-gray-500">Toggle whether customers can order right now.</p>
          <button
            onClick={toggleOpen}
            className={`btn mt-4 w-full py-2.5 ${form.is_open ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {form.is_open ? 'Open — accepting orders' : 'Closed — tap to open'}
          </button>
        </div>

        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-bold"><Tag className="h-4 w-4" /> Offer</h3>
          <input className="input mt-3" placeholder="e.g. 50% OFF up to ₹100" value={form.offer_text || ''} onChange={update('offer_text')} />
          <p className="mt-2 text-xs text-gray-400">Shown as a badge on your restaurant card. Save below to apply.</p>
        </div>
      </div>

      {/* Details form */}
      <form onSubmit={save} className="card space-y-4 p-6 lg:col-span-2">
        <h3 className="flex items-center gap-2 font-bold"><Store className="h-4 w-4" /> Restaurant details</h3>
        {saved && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Saved!</div>}
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium">Name</label><input className="input" value={form.name || ''} onChange={update('name')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Cuisine</label><input className="input" value={form.cuisine || ''} onChange={update('cuisine')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Delivery time</label><input className="input" value={form.delivery_time || ''} onChange={update('delivery_time')} /></div>
          <div><label className="mb-1 block text-sm font-medium">Price for two</label><input className="input" type="number" value={form.price_for_two || ''} onChange={update('price_for_two')} /></div>
        </div>
        <div><label className="mb-1 block text-sm font-medium">Address</label><input className="input" value={form.address || ''} onChange={update('address')} /></div>
        <div><label className="mb-1 block text-sm font-medium">Image URL</label><input className="input" value={form.image_url || ''} onChange={update('image_url')} /></div>
        <div><label className="mb-1 block text-sm font-medium">Description</label><textarea className="input" rows={3} value={form.description || ''} onChange={update('description')} /></div>
        <button className="btn-primary py-2.5">Save changes</button>
      </form>
    </div>
  );
}
