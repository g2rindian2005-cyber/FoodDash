import { Link } from 'react-router-dom';
import Page from '../components/Page';

export default function NotFound() {
  return (
    <Page className="max-w-lg text-center">
      <div className="card p-12">
        <h1 className="text-6xl font-extrabold text-brand">404</h1>
        <p className="mt-4 text-gray-500">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6 px-6 py-3">Back home</Link>
      </div>
    </Page>
  );
}
