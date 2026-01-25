"use client"

import { Search, Bell, Shield, Clock, Plus, Loader2, Package, X, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from "@/components/UserContext";
import { useRouter } from "next/navigation";
import HamburgerMenu from "../HamburgerMenu";
import ProductCard from "../ProductCard";
import { Product } from "../../types";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isUserLoading, refreshUser } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    expiringCount: 0,
    expiredCount: 0
  });
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);  // Stores products found by search
  const [isSearching, setIsSearching] = useState(false); // True when search is happening (shows loading spinner)
  const [showFilters, setShowFilters] = useState(false); // True when filter dropdown menu is open
  const [userSelectedDays, setUserSelectedDays] = useState<number | null>(null);
  const [thresholdInput, setThresholdInput] = useState<string>("");
  const [isCustomThreshold, setIsCustomThreshold] = useState(false);

  const categories = [
    "non-veg",
    "medicine",
    "cosmetics",
    "dairy",
    "drinks",
    "groceries",
    "other"
  ];

  // Fetch dashboard data
  // useEffect(() => {
  //   if (!user) return;

  //   // Initialize input once user data is available
  //   if (!thresholdInput && user.reminderDays) {
  //     setThresholdInput(user.reminderDays.toString());
  //   }

  //   fetchDashboardData();
  //   triggerReminderOnLogin();
  // }, [user, userSelectedDays]);

  const triggerReminderOnLogin = useCallback(async () => {
    // Check if we've already triggered reminder in this session
    const hasTriggered = sessionStorage.getItem("loginReminderTriggered");
    if (hasTriggered || !user) return;

    try {
      const token = localStorage.getItem("token");
      await fetch("/api/sendReminders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      sessionStorage.setItem("loginReminderTriggered", "true");
    } catch (error) {
      console.error("Error triggering login reminder:", error);
    }
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");// Get authentication token from browser storage,Token proves user is logged in

      // Fetch stats
      const daysToCheck = userSelectedDays || user?.reminderDays || 7;
      const statsRes = await fetch(`/api/total_items_count?days=${daysToCheck}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch expiring products
      const expiringRes = await fetch(`/api/expiringSoon?days=${daysToCheck}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (expiringRes.ok) {
        const expiringData = await expiringRes.json();
        setExpiringProducts(expiringData.expiringProducts || []); // if no products, use empty array instead
      }

      // Fetch recent products
      const allProductsRes = await fetch("/api/products", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (allProductsRes.ok) {
        const allProducts = await allProductsRes.json();
        const sorted = allProducts.sort((a: Product, b: Product) =>   // For every pair of products:
          //a = first product
          //b = second product
          // b.createdAt and a.createdAt is a date string
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() // Converts the date into a number
        );
        setRecentProducts(sorted.slice(0, 5)); // Take the first 5 items from the sorted list and 
        // store them in React state so the UI shows only the 5 most recent products.
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);  // Ensures UI doesn’t stay stuck in “Loading…”
    }
  }, [user, userSelectedDays]);



   useEffect(() => {
    if (!user) return;

    // Initialize input once user data is available
    if (!thresholdInput && user.reminderDays) {
      setThresholdInput(user.reminderDays.toString());
    }

    fetchDashboardData();
    triggerReminderOnLogin();
  }, [user, userSelectedDays, thresholdInput,
  fetchDashboardData,
  triggerReminderOnLogin]);



  // Search products
  const handleSearch = async (query: string) => { // Defines an async function that accepts a query, ensures only strings are passed
    setSearchQuery(query);// Stores the latest search text in React state, lets you show the query in the input field

    if (!query.trim()) { // checks if nothing or spaces are searched
      setSearchResults([]); // [] means empty list, Remove all previously found search results from the screen, or typed something ambiguous
      setIsSearching(false);// user cleared input, search is cancelled
      return;
    }

    try {
      setIsSearching(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/searchProduct?query=${encodeURIComponent(query)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter by category
  const handleCategoryFilter = async (category: string) => {  // runs when the user selects a category
    setSelectedCategory(category);// remembers which category the user chose
    setShowFilters(false);// close filter dropdown menu

    if (!category) {  // If no category is selected, load the normal dashboard data and stop here.
      fetchDashboardData();
      return;
    }

    try { // code starts loading, gets the user’s login token, and calls a protected API to fetch products of a selected category
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/filterProduct?category=${encodeURIComponent(category)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });




      // This code filters products to keep only those expiring in the next 5 days and updates the UI with them.
      if (response.ok) {
        const data = await response.json();  // API response from JSON → JavaScript object
        setRecentProducts(data.products || []); // Updates state with all products from the selected category

        const daysToCheck = userSelectedDays || user?.reminderDays || 7;

        setExpiringProducts(data.products.filter((p: Product) => {  // filter goes through each product one by one, p represents one product
          const daysUntilExpiry = calculateDaysUntilExpiryNum(p.expiry_date); // Calculates how many days are left before expiry
          return daysUntilExpiry >= 0 && daysUntilExpiry <= daysToCheck; // condition that decides whether to keep the product.
          // >= 0 → product is not expired , <= 5 → product expires within 5 days
        }));
      }
    } catch (error) {
      console.error("Filter error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
    setSearchResults([]);
    fetchDashboardData();
  };

  // Redirect if not authenticated
  useEffect(() => { // user data has finished loading (!isUserLoading),AND user is not logged in, Redirects to /login
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleEditItem = (productId: string) => { // Takes a product ID,Navigates to a dynamic edit page like: /edit-item/12345

    router.push(`/edit-item/${productId}`);
  };

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

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update threshold");
        return;
      }

      toast.success("Threshold updated!");
      // Refresh user to sync global state
      await refreshUser();
    } catch (error) {
      console.error("Error updating threshold:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteItem = async (productId: string) => { // Shows browser confirm popup, Stops deletion if user clicks Cancel
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/deleteProduct/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) { // Removes deleted item from: Expiring products, Recent products, Search results
        setExpiringProducts(prev => prev.filter((item) => item._id !== productId));
        // prev = current list of expiring products, filter() keeps all items except the deleted one, Result: deleted product disappears from 
        // Expiring Products


        setRecentProducts(prev => prev.filter((item) => item._id !== productId)); // deleted product disappears from Recent Products
        setSearchResults(prev => prev.filter((item) => item._id !== productId));//  deleted product disappears from Search Results
        setStats(prev => ({ ...prev, totalItems: prev.totalItems - 1 }));
        //prev => (...)---> prev = previous (current) state,Ensures you always use the latest value, ...prev → keeps all existing stats,
        // totalItems: prev.totalItems - 1 → decreases total count by 1. Therefore, Only totalItems changes, everything else stays the same.

      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const calculateDaysUntilExpiryNum = (expiryDate: string) => { // Takes expiryDate as a string usually from backend
    const today = new Date(); // Gets the current date with time
    today.setHours(0, 0, 0, 0); // Remove time from today, We want date-only comparison
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); // Math.ceil() → round up
  }; // calc how many days left before expiry

  const calculateDaysUntilExpiry = (expiryDate: string) => { // Takes the expiry date of a product (entered by user & stored in DB)
    const days = calculateDaysUntilExpiryNum(expiryDate); // This returns a number
    if (days === 0) return "today";
    if (days === 1) return "1 day";
    if (days < 0) return "expired";
    return `${days} days`; // Allow variables inside strings using ${}
  };

  const formatTimeAgo = (date?: string) => { // Takes a date string
    if (!date) return "recently"; // If date is null, undefined, or empty,  Return "recently"
    const now = new Date();
    const added = new Date(date); // Convert input date to Date object
    const diffMs = now.getTime() - added.getTime(); // how long ago the item was added
    const diffMins = Math.floor(diffMs / 60000); // calc min difference
    const diffHours = Math.floor(diffMs / 3600000); // calc hours difference
    const diffDays = Math.floor(diffMs / 86400000); // calc days difference

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // maps a product category to an emoji 
  const getCategoryEmoji = (category: string) => { // Takes a category name as a string
    const emojis: Record<string, string> = {
      'non-veg': '🍖', 'medicine': '💊', 'cosmetics': '💄',
      'dairy': '🥛', 'drinks': '🥤', 'groceries': '🛒', 'other': '📦'
    };
    return emojis[category] || '📦'; // tries to find emoji for that category
  };

  if (isUserLoading || loading) { // If:user data has finished loading (!isUserLoading),AND user is not logged in,Redirects to /login
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const displayProducts = searchQuery.trim() ? searchResults : recentProducts;
  // deciding which products to display based on the search query.


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Hello,</p>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          </div>
          <HamburgerMenu />
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${selectedCategory
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'border-gray-300 bg-white text-gray-700'
              }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">
              {selectedCategory || 'All Categories'}
            </span>
          </button>

          {selectedCategory && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-2 p-2 bg-white border border-gray-200 rounded-xl shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCategoryFilter("")}
                className={`px-3 py-2 text-sm rounded-lg ${!selectedCategory
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-3 py-2 text-sm rounded-lg capitalize ${selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {getCategoryEmoji(category)} {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Search Results {isSearching && <Loader2 className="inline w-4 h-4 animate-spin ml-2" />}
          </h2>
          {searchResults.length === 0 && !isSearching ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found for {searchQuery}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((product) => (
                <ProductCard
                  key={product._id}
                  image={product.image_url}
                  name={product.product_name}
                  category={product.category}
                  subText={`${product.category} • Qty: ${product.quantity} • Added ${formatTimeAgo(product.createdAt)}`}
                  onEdit={() => handleEditItem(product._id)}
                  onDelete={() => handleDeleteItem(product._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards - Only show if not searching */}
      {!searchQuery.trim() && (
        <div className="px-5 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{stats.totalItems}</h2>
              <p className="text-sm text-gray-500 mt-1">Total Items</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{stats.expiringCount}</h2>
              <p className="text-sm text-gray-500 mt-1">Expiring Soon ({userSelectedDays || user?.reminderDays || 7} days)</p>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Soon Section - Only show if not searching */}
      {!searchQuery.trim() && (
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">Expiring Soon</h2>
              <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {!isCustomThreshold ? (
                  <select
                    value={userSelectedDays || user?.reminderDays || 7}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setIsCustomThreshold(true);
                      } else {
                        updateThreshold(parseInt(val));
                      }
                    }}
                    className="bg-transparent text-xs font-bold text-amber-700 focus:outline-none cursor-pointer"
                  >
                    {Array.from(new Set([3, 5, 7, 10, 15, 30, 60, 90, 365, user?.reminderDays || 7])).sort((a, b) => a - b).map((d) => (
                      <option key={d} value={d}>
                        {d} Days
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1">
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
                      className="bg-transparent text-xs font-bold text-amber-700 focus:outline-none w-10 text-center border-b border-amber-200"
                    />
                    <button
                      onClick={() => setIsCustomThreshold(false)}
                      className="text-[10px] text-amber-600 hover:text-amber-800"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                {!isCustomThreshold && <span className="text-[10px] font-bold text-amber-600">Days</span>}
              </div>
            </div>
            <button
              onClick={() => router.push("/expiring-soon")}
              className="text-sm text-blue-600 font-medium"
            >
              See All
            </button>
          </div>

          {expiringProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No items expiring soon</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringProducts.slice(0, 3).map((product) => (
                <ProductCard
                  key={product._id}
                  image={product.image_url}
                  name={product.product_name}
                  category={product.category}
                  subText={`${product.category} • Qty: ${product.quantity} • Expires in ${calculateDaysUntilExpiry(product.expiry_date)}`}
                  onEdit={() => handleEditItem(product._id)}
                  onDelete={() => handleDeleteItem(product._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recently Added / Filtered Products Section */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedCategory ? `${selectedCategory} Products` : 'Recently Added'}
          </h2>
          <button
            onClick={() => router.push("/products")}
            className="text-sm text-blue-600 font-medium"
          >
            See All
          </button>
        </div>

        {displayProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayProducts.map((product) => (
              <ProductCard
                key={product._id}
                image={product.image_url}
                name={product.product_name}
                category={product.category}
                subText={`${product.category} • Qty: ${product.quantity} • Added ${formatTimeAgo(product.createdAt)}`}
                onEdit={() => handleEditItem(product._id)}
                onDelete={() => handleDeleteItem(product._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Add Product */}
      <button
        onClick={() => router.push("/add-item")}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 z-50 flex items-center justify-center"
        aria-label="Add New Product"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}