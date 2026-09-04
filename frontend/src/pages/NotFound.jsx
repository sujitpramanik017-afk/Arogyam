import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="text-center py-16 space-y-4">
      <h2 className="text-4xl font-extrabold text-slate-800">404</h2>
      <p className="text-sm text-slate-500">The requested hospital page or record was not found.</p>
      <Link to="/dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
        Return to Dashboard
      </Link>
    </div>
  );
};
