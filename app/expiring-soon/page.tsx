"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Bell,
    Clock,
    Loader2,
    X
    
} from "lucide-react";
import { useUser } from "@/components/UserContext";
import ProductCard from "../components/ProductCard";
import HamburgerMenu from "../components/HamburgerMenu";
import { Product } from "../types";
import { toast } from "sonner";

export default function ExpiringSoonPage() {
    const router = useRouter();
    const { user, isUserLoading, refreshUser } = useUser();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCustomThreshold, setIsCustomThreshold] = useState(false);
    const [userSelectedDays, setUserSelectedDays] = useState<number | null>(null);
    const [thresholdInput, setThresholdInput] = useState<string>("");

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push("/login");
        }
    }, [user, isUserLoading, router]);

    // useEffect(() => {
    //     if (user) {
    //         if (!thresholdInput && user.reminderDays) {
    //             setThresholdInput(user.reminderDays.toString());
    //         }
    //         fetchExpiringItems();
    //     }
    // }, [user, thresholdInput, fetchExpiringItems]);

    const fetchExpiringItems =  useCallback (async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const days = userSelectedDays || user?.reminderDays || 7;
            const response = await fetch(`/api/expiringSoon?days=${days}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setProducts(data.expiringProducts || []);
            }
        } catch (error) {
            console.error("Error fetching expiring items:", error);
            toast.error("Failed to load expiring items");
        } finally {
            setLoading(false);
        }
    }, [userSelectedDays, user?.reminderDays]);

    useEffect(() => {
    if (user) {
        fetchExpiringItems();   // ✅ now it exists
    }
}, [user, fetchExpiringItems]);


    const updateThreshold = async (days: number) => {
        setUserSelectedDays(days);
        setThresholdInput(days.toString());
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/updateSettings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reminderDays: days }),
            });

            if (response.ok) {
                toast.success("Threshold updated!");
                await refreshUser();
            } else {
                toast.error("Failed to update threshold");
            }
        } catch (error) {
            console.error("Error updating threshold:", error);
        }
    };

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

    if (isUserLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 px-4 md:px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Expiring Soon</h1>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Managed Inventory</p>
                    </div>
                </div>
                <HamburgerMenu />
            </header>

            <main className="pt-24 px-4 md:px-8 max-w-4xl mx-auto">
                {/* Stats & Filter Bar */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-2xl">
                            <Bell className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Expiring within {userSelectedDays || user?.reminderDays || 7} days</p>
                            <h2 className="text-2xl font-bold text-gray-900">{products.length} Items</h2>
                        </div>
                    </div>

                    {/* Threshold Hybrid Selector */}
                    <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Threshold:</span>

                        {!isCustomThreshold ? (
                            <select
                                value={userSelectedDays || user.reminderDays || 7}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "custom") {
                                        setIsCustomThreshold(true);
                                    } else {
                                        updateThreshold(parseInt(val));
                                    }
                                }}
                                className="bg-transparent text-sm font-bold text-blue-600 focus:outline-none cursor-pointer"
                            >
                                {Array.from(new Set([3, 7, 15, 30, 60, 90, 365, userSelectedDays || user.reminderDays]))
                                    .filter((d): d is number => d !== undefined)
                                    .sort((a, b) => a - b)
                                    .map((d) => (
                                        <option key={d} value={d}>
                                            {d} Days
                                        </option>
                                    ))}
                                <option value="custom">Custom...</option>
                            </select>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={thresholdInput}
                                    onChange={(e) => setThresholdInput(e.target.value)}
                                    onBlur={() => {
                                        const val = parseInt(thresholdInput);
                                        if (!isNaN(val) && val > 0) {
                                            updateThreshold(val);
                                        }
                                        setIsCustomThreshold(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt(thresholdInput);
                                            if (!isNaN(val) && val > 0) {
                                                updateThreshold(val);
                                            }
                                            setIsCustomThreshold(false);
                                        }
                                    }}
                                    autoFocus
                                    className="w-12 text-sm font-bold text-blue-600 focus:outline-none border-b border-blue-200"
                                />
                                <button onClick={() => setIsCustomThreshold(false)}>
                                    <X className="w-3 h-3 text-gray-400" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500 font-medium">Scanning for expiring items...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 shadow-sm text-center border border-gray-100">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2"> Everything&apos;s Fresh!</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            No items are expiring within your {userSelectedDays || user.reminderDays || 7} day threshold. Great job managing your inventory!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {products.map((product) => (
                            <ProductCard
                                key={product._id}
                                image={product.image_url}
                                name={product.product_name}
                                category={product.category}
                                subText={`${product.category} • Qty: ${product.quantity} • Expires in ${calculateDaysUntilExpiry(product.expiry_date)}`}
                                onEdit={() => router.push(`/edit-item/${product._id}`)}
                                onDelete={async () => {
                                    if (confirm("Delete this item?")) {
                                        const token = localStorage.getItem("token");
                                        await fetch(`/api/deleteProduct/${product._id}`, {
                                            method: "DELETE",
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        fetchExpiringItems();
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
