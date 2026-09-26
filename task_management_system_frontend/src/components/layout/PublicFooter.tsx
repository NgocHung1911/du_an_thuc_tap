import React from "react";
import { Link } from "react-router-dom";

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-stone-200/80 py-8 px-6 lg:px-8 bg-white">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/disdu197t/image/upload/v1789886003/logo_vgnv5o.jpg"
            alt="Kira logo"
            className="w-5 h-5 rounded-lg object-contain"
          />
          <span className="font-bold text-stone-900 text-sm">Kira</span>
          <span>— Enterprise Task & Project Management System</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="/#features" className="hover:text-stone-900 transition-colors">
            Features
          </a>
          <a href="/#how-it-works" className="hover:text-stone-900 transition-colors">
            How it works
          </a>
          <a href="/#pricing" className="hover:text-stone-900 transition-colors">
            Pricing
          </a>
          <Link to="/login" className="hover:text-stone-900 transition-colors">
            Sign in
          </Link>
        </div>

        <p>© {new Date().getFullYear()} TaskFlow Inc. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default PublicFooter;
