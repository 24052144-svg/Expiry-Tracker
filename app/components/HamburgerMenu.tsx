'use client';

import { Menu, Plus, Package, Clock, Settings, BookOpen, Trash2, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  const handleLogout = () => {
    try {
      setUser(null);
    } catch (e) {
      console.warn("setUser not available on context", e);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
    setOpen(false);
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Call delete account API
      router.push("/delete-account");
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Menu">
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {open && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-xl p-2 z-50">
            <MenuItem
              label="Add Item"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                router.push('/add-item');
                setOpen(false);
              }}
            />
            <MenuItem
              label="All Products"
              icon={<Package className="w-4 h-4" />}
              onClick={() => {
                router.push('/products');
                setOpen(false);
              }}
            />
            <MenuItem
              label="Categories"
              icon={<Package className="w-4 h-4" />}
              onClick={() => {
                router.push('/categories');
                setOpen(false);
              }}
            />
            <MenuItem
              label="Expired Items"
              icon={<Clock className="w-4 h-4" />}
              onClick={() => {
                router.push('/expired');
                setOpen(false);
              }}
            />
            <MenuItem
              label="Recipe Suggestions"
              icon={<BookOpen className="w-4 h-4" />}
              onClick={() => {
                router.push('/recipes');
                setOpen(false);
              }}
            />
            <MenuItem
              label="Settings"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => {
                router.push('/settings');
                setOpen(false);
              }}
            />

            <hr className="my-2 border-gray-200" />

            <MenuItem
              label="Delete Account"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteAccount}
              danger
            />
            <MenuItem
              label="Logout"
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-100'
        }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}