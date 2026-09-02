import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";

interface PublicHeaderProps {
  transparentOnTop?: boolean;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ transparentOnTop = true }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const dashboardPath = isAdmin ? "/admin/dashboard" : "/member/my-tasks";

  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "How it works", href: "/#how-it-works" },
    { name: "Infrastructure", href: "/#infrastructure" },
    { name: "Pricing", href: "/#pricing" },
  ];

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen || !transparentOnTop
            ? "bg-white/90 backdrop-blur-xl border border-stone-200/80 rounded-2xl shadow-sm max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          {/* Brand Logo - Original Text Style */}
          <Link to="/" className="flex items-center gap-2 group">
            <span
              className={`font-display tracking-tight text-stone-900 transition-all duration-500 font-bold ${
                isScrolled ? "text-xl" : "text-2xl"
              }`}
            >
              Kira
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs uppercase tracking-wider font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* User Auth Buttons - Original Styling */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full border border-stone-300 bg-white/80 text-stone-800 hover:bg-stone-100/80 shadow-xs transition-all"
                >
                  <LayoutDashboard size={14} />
                  <span>Workspace</span>
                </Link>

                <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                  <div className="w-7 h-7 rounded-full bg-stone-900 text-stone-50 text-xs font-bold flex items-center justify-center">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-medium text-stone-800 max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Log out"
                    className="p-1 text-stone-500 hover:text-red-600 rounded-full transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <button className="inline-flex items-center justify-center font-medium transition-all cursor-pointer border border-stone-300 bg-white/80 text-stone-800 hover:bg-stone-100/80 hover:border-stone-400 shadow-xs px-4 py-1.5 text-xs rounded-full">
                    Sign in
                  </button>
                </Link>
                <Link to="/register">
                  <button className="inline-flex items-center justify-center font-medium transition-all cursor-pointer bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-md shadow-stone-900/10 px-4 py-1.5 text-xs rounded-full">
                    Get started
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-stone-700 hover:text-stone-900"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200/80 px-6 py-6 space-y-4 bg-white/95 rounded-b-2xl">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-medium text-stone-700 hover:text-stone-900"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 border-t border-stone-200 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2 px-4 rounded-full text-sm font-medium border border-stone-300 text-stone-800 text-center"
                  >
                    Go to Workspace ({user.username})
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2 px-4 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-200 text-center flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2 px-4 rounded-full text-sm font-medium border border-stone-300 text-stone-800 text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2 px-4 rounded-full text-sm font-medium bg-stone-900 text-stone-50 text-center"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default PublicHeader;
