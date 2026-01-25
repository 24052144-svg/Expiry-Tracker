"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Loader2,
    Package,
    ChevronLeft
} from "lucide-react";
//import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "../components/ProductCard";
import HamburgerMenu from "../components/HamburgerMenu";
import axios from "axios";
import { toast } from "sonner";
import { Product } from "../types";

export default function AllProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    router.push("/login");
                    return;
                }
                const response = await axios.get("/api/products", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(response.data);
            } catch (error) {
                console.error("Error fetching products:", error);
                toast.error("Failed to load products");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [router]);

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ["all", ...Array.from(cats)];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.product_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategory]);

    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return "unknown date";
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
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
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 px-4 md:px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Go back"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">All Products</h1>
                </div>
                <HamburgerMenu />
            </header>

            <main className="pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto">
                {/* Search and Filters */}
                <div className="mb-8 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white pl-10 h-12 rounded-xl border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100 shadow-sm"
                                    }`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product List */}
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500">
                            {searchQuery || selectedCategory !== "all"
                                ? "Try adjusting your search or filters"
                                : "You haven't added any products yet"}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                        {filteredProducts.map((p) => (
                            <ProductCard
                                key={p._id}
                                image={p.image_url}
                                name={p.product_name}
                                category={p.category}
                                subText={`${p.category} • Qty: ${p.quantity} • Added ${formatTimeAgo(p.createdAt)}`}
                                onEdit={() => router.push(`/edit-item/${p._id}`)}
                                onDelete={async () => {
                                    if (confirm("Are you sure you want to delete this product?")) {
                                        try {
                                            const token = localStorage.getItem("token");
                                            await axios.delete(`/api/deleteProduct/${p._id}`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            setProducts(products.filter((item: Product) => item._id !== p._id));
                                            toast.success("Product deleted");
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Failed to delete product");
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
