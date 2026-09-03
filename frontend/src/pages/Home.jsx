import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Zap, ShieldCheck, Truck } from 'lucide-react';
import Page from '../components/Page';

const features = [
  { icon: Zap, title: 'Lightning fast', desc: 'Average delivery in under 35 minutes.' },
  { icon: ShieldCheck, title: 'Safe & hygienic', desc: 'Contactless delivery and verified kitchens.' },
  { icon: Truck, title: 'Live tracking', desc: 'Watch your order move in real time.' },
];

export default function Home() {
  return (
    <Page>
      {/* Hero */}
      <section className="grid items-center gap-8 rounded-3xl bg-gradient-to-br from-brand to-brand-light p-8 text-white sm:p-14 md:grid-cols-2">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-extrabold leading-tight sm:text-5xl"
          >
            Hungry? Order food you love, delivered fast.
          </motion.h1>
          <p className="mt-4 max-w-md text-white/90">
            Discover the best restaurants near you and get your favourite meals
            delivered hot to your door.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/restaurants" className="btn bg-white px-6 py-3 text-brand hover:bg-gray-100">
              <Search className="h-5 w-5" /> Explore Restaurants
            </Link>
            <Link to="/signup" className="btn border border-white/60 px-6 py-3 text-white hover:bg-white/10">
              Create account
            </Link>
          </div>
        </div>
        <motion.img
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
          alt="Delicious food"
          className="hidden rounded-3xl object-cover shadow-2xl md:block"
        />
      </section>

      {/* Features */}
      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl bg-gray-900 p-8 text-white sm:flex-row sm:p-12">
        <div>
          <h2 className="text-2xl font-bold">Ready to eat?</h2>
          <p className="text-gray-300">Browse restaurants and place your first order in minutes.</p>
        </div>
        <Link to="/restaurants" className="btn bg-brand px-6 py-3 text-white hover:bg-brand-dark">
          Order now
        </Link>
      </section>
    </Page>
  );
}
