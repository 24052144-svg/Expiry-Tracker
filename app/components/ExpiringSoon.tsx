
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import ProductCard from "./ProductCard";
import { Product } from "../types";

export default function ExpiringSoon() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/expiringSoon?days=5", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data.expiringProducts || []);
        }
      } catch (error) {
        console.error("Error fetching expiring products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiringProducts();
  }, []);

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1 day";
    if (diffDays < 0) return "expired";
    return `${diffDays} days`;
  };

  // const getCategoryEmoji = (category: string) => {
  //   const emojis: Record<string, string> = {
  //     "non-veg": "🍖",
  //     medicine: "💊",
  //     cosmetics: "💄",
  //     dairy: "🥛",
  //     drinks: "🥤",
  //     groceries: "🛒",
  //     other: "📦",
  //   };
  //   return emojis[category] || "📦";
  // };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/deleteProduct/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Expiring Soon"
        onSeeAll={() => router.push("/expiring-soon")}
      />

      {loading ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No items expiring soon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.slice(0, 3).map((product) => (
            <ProductCard
              key={product._id}
              image={product.image_url}
              name={product.product_name}
              category={product.category}
              subText={`${product.category} • Qty: ${product.quantity} • Expires in ${calculateDaysUntilExpiry(product.expiry_date)}`}
              onEdit={() => router.push(`/edit-item/${product._id}`)}
              onDelete={() => handleDelete(product._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll: () => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <button onClick={onSeeAll} className="text-blue-600 text-sm font-medium">
        See All
      </button>
    </div>
  );
}