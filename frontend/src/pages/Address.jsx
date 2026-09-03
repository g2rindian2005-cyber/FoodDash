import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Page from '../components/Page';

export default function Address() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('checkoutAddress')) || blank();
    } catch {
      return blank();
    }
  });

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    localStorage.setItem('checkoutAddress', JSON.stringify(form));
    navigate('/payment');
  };

  return (
    <Page className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-extrabold">Delivery address</h1>
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Address label</label>
          <select className="input" value={form.label} onChange={update('label')}>
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Address line 1</label>
          <input className="input" required value={form.line1} onChange={update('line1')} placeholder="Flat / House no, Building" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Address line 2</label>
          <input className="input" value={form.line2} onChange={update('line2')} placeholder="Street, Area (optional)" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">City</label>
            <input className="input" required value={form.city} onChange={update('city')} placeholder="Bengaluru" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">State</label>
            <input className="input" value={form.state} onChange={update('state')} placeholder="Karnataka" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Pincode</label>
            <input className="input" required value={form.pincode} onChange={update('pincode')} placeholder="560001" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input className="input" value={form.phone} onChange={update('phone')} placeholder="9000000000" />
          </div>
        </div>
        <button className="btn-primary w-full py-3">
          Continue to payment <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </Page>
  );
}

function blank() {
  return { label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' };
}
