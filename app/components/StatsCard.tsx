// TOTAL ITEMS + EXPIRING SOON

"use client";

import { useEffect, useState } from "react";
import { Shield, Bell, Loader2 } from "lucide-react";

export default function StatsCard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    expiringCount: 0,
    expiredCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/total_items_count", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card
        title="Total Items"
        value={stats.totalItems}
        icon={<Shield className="w-6 h-6 text-blue-600" />}
        bgColor="bg-blue-100"
      />
      <Card
        title="Expiring Soon"
        value={stats.expiringCount}
        icon={<Bell className="w-6 h-6 text-amber-600" />}
        bgColor="bg-amber-100"
        alert
      />
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  bgColor,
  alert,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h2 className={`text-3xl font-bold ${alert ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </h2>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}