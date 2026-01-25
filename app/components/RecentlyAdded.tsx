"use client";
//import Image from "next/image";
import ProductCard from "./ProductCard";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Loader2 } from "lucide-react";
import { Product } from "../types";

export default function RecentlyAdded() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const sorted = data.sort(
            (a: Product, b: Product) =>
              new Date(b.createdAt || b.updatedAt || 0).getTime() -
              new Date(a.createdAt || a.updatedAt || 0).getTime()
          );
          setProducts(sorted.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching recent products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProducts();
  }, []);

  const formatTimeAgo = (date?: string) => {
    if (!date) return "recently";

    const now = new Date();
    const added = new Date(date);
    const diffMs = now.getTime() - added.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Recently Added</h2>
        <button
          onClick={() => router.push("/products")}
          className="text-blue-600 text-sm font-medium"
        >
          See All
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No items added yet</p>
          <button
            onClick={() => router.push("/add-item")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              image={product.image_url}
              name={product.product_name}
              category={product.category}
              subText={`${product.category} • Qty: ${product.quantity} • Added ${formatTimeAgo(product.createdAt || product.updatedAt)}`}
              onEdit={() => router.push(`/edit-item/${product._id}`)}
              onDelete={() => handleDelete(product._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
