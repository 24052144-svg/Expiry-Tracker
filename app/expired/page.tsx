"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    Trash2,
    ChevronLeft,
    AlertTriangle,
    History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "../components/ProductCard";
import HamburgerMenu from "../components/HamburgerMenu";
import axios from "axios";
import { toast } from "sonner";
import { Product } from "../types";

export default function ExpiredItemsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchExpired = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    router.push("/login");
                    return;
                }
                const response = await axios.get("/api/expired", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // The API returns { expiredProducts: [...] }
                setProducts(response.data.expiredProducts || []);
            } catch (error) {
                console.error("Error fetching expired items:", error);
                toast.error("Failed to load expired items");
            } finally {
                setIsLoading(false);
            }
        };
        fetchExpired();
    }, [router]);

    const calculateDaysAgo = (expiryDate: string) => {
        const diff = new Date().getTime() - new Date(expiryDate).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return days === 0 ? "Today" : `${days} days ago`;
    };

    const handleDeleteAll = async () => {
        if (confirm("Are you sure you want to clear all expired items?")) {
            // This is a placeholder for a bulk delete API if available, 
            // otherwise we'd loop or just suggest deleting individually.
            toast.info("Bulk delete not implemented yet. Please delete items individually.");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 px-4 md:px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Expired Items</h1>
                </div>
                <HamburgerMenu />
            </header>

            <main className="pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">{products.length} {products.length === 1 ? 'item has' : 'items have'} expired</span>
                    </div>
                    {products.length > 0 && (
                        <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDeleteAll}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>

                {products.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-600">
                            <History className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No expired items!</h3>
                        <p className="text-gray-500">Great job keeping track of your inventory.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                        {products.map((p) => (
                            <ProductCard
                                key={p._id}
                                image={p.image_url}
                                name={p.product_name}
                                category={p.category}
                                subText={`Expired ${calculateDaysAgo(p.expiry_date)} • Qty: ${p.quantity}`}
                                onEdit={() => router.push(`/edit-item/${p._id}`)}
                                onDelete={async () => {
                                    if (confirm("Delete this expired item?")) {
                                        try {
                                            const token = localStorage.getItem("token");
                                            await axios.delete(`/api/deleteProduct/${p._id}`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                           setProducts(products.filter((item) => item._id !== p._id));

                                            toast.success("Item removed");
                                        } catch (error: unknown)  {
                                             console.error(error);
                                            toast.error("Failed to delete item");
                                        }
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
