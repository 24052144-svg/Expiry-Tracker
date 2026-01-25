"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    ChevronLeft,
    Tag
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import HamburgerMenu from "../components/HamburgerMenu";
import axios from "axios";
import { toast } from "sonner";
import { Product } from "../types";

const CATEGORIES_LIST = [
    "non-veg",
    "medicine",
    "cosmetics",
    "dairy",
    "drinks",
    "groceries",
    "other",
];

const categoryEmojis: Record<string, string> = {
    "non-veg": "🍖",
    medicine: "💊",
    cosmetics: "💄",
    dairy: "🥛",
    drinks: "🥤",
    groceries: "🛒",
    other: "📦",
};

export default function CategoriesPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES_LIST[0]);

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
                toast.error("Failed to load items");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [router]);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => p.category === selectedCategory);
    }, [products, selectedCategory]);

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
                    <h1 className="text-xl font-bold text-gray-900">Categories</h1>
                </div>
                <HamburgerMenu />
            </header>

            <main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Category Sidebar */}
                <div className="w-full md:w-64 shrink-0 space-y-2">
                    {CATEGORIES_LIST.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedCategory === cat
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-100 ring-2 ring-blue-600 ring-offset-2"
                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-100 shadow-sm"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{categoryEmojis[cat]}</span>
                                <span className="font-semibold capitalize">{cat}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${selectedCategory === cat ? "bg-blue-500" : "bg-gray-100 text-gray-500"
                                }`}>
                                {products.filter(p => p.category === cat).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-2xl">
                            {categoryEmojis[selectedCategory]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 capitalize">{selectedCategory}</h2>
                            <p className="text-gray-500 text-sm">Viewing all items in this category</p>
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Tag className="w-10 h-10" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
                            <p className="text-gray-500">{"You haven't added any products to this category yet."}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                            {filteredProducts.map((p) => (
                                <ProductCard
                                    key={p._id}
                                    image={p.image_url}
                                    name={p.product_name}
                                    category={p.category}
                                    subText={`Qty: ${p.quantity} • ${p.expiry_date ? 'Expires ' + new Date(p.expiry_date).toLocaleDateString() : 'No expiry'}`}
                                    onEdit={() => router.push(`/edit-item/${p._id}`)}
                                    onDelete={async () => {
                                        if (confirm("Delete this product?")) {
                                            try {
                                                const token = localStorage.getItem("token");
                                                await axios.delete(`/api/deleteProduct/${p._id}`, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                setProducts(products.filter((item) => item._id !== p._id));
                                                toast.success("Product deleted");
                                            } catch {
                                                toast.error("Failed to delete product");
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
