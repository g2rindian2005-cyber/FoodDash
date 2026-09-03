import { UtensilsCrossed } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row">
        <div className="flex items-center gap-2 font-bold text-brand">
          <UtensilsCrossed className="h-5 w-5" /> FoodDash
        </div>
        <p>© {new Date().getFullYear()} FoodDash. Built for learning. All food images via Unsplash.</p>
      </div>
    </footer>
  );
}
