import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/goals', label: 'Goals' },
  { to: '/reports', label: 'Reports' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
const menuRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('touchstart', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside);
  };
}, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#D3E3FB] border-b border-[#B5CCF0] shadow-sm sticky top-0 z-10">
      <div className="w-full px-6 lg:px-10 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Finora logo" className="h-9 w-auto" />
          <span className="text-2xl font-extrabold tracking-tight text-[#013472]">
            Fin<span className="text-[#1aa87d]">ora</span>
          </span>
        </div>
        <div className="hidden md:flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-[#27457a] hover:bg-white/60'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        
        <div className="relative" ref={menuRef}>


          <button
            onClick={() => setOpen((o) => !o)}
            className="px-4 py-2 rounded-md bg-brand-700 hover:bg-brand-700 text-white text-sm max-w-[140px] sm:max-w-none"
          >
            <span className="block truncate font-bold uppercase">{user?.name?.trim().split(' ')[0]}</span>
          </button>



          {open && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-xl shadow-lg p-4 z-20">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-3">Personal details</div>

              <div className="mb-3">
                <div className="text-xs text-gray-500">Name</div>
                <div className="text-sm font-medium break-words">{user?.name}</div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm font-medium break-all">{user?.email}</div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-sm py-2 rounded-md bg-red-50 text-red-600 font-medium hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>



      </div>
      <div className="md:hidden flex overflow-x-auto gap-1 px-2 pb-2">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-[#27457a]'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
