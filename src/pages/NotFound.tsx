import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-brand-accent opacity-20">404</h1>
        <div className="relative -mt-20">
          <h2 className="text-4xl font-bold mb-4">Page Not Found</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            The destination you're looking for doesn't exist in our itinerary.
            Let's get you back on track.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-opacity"
          >
            <Home size={20} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
