"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Loader2,
    ChevronLeft,
    ChefHat,
    Info,
    X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HamburgerMenu from "../components/HamburgerMenu";
import axios from "axios";
import { toast } from "sonner";
import { Recipe } from "../types";
import Image from "next/image";


export default function RecipesPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    type RecipeDetails = Recipe & {
    ingredients: string[];
    instructions: string;
   };
const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);

    //const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const response = await axios.get(`/api/searchRecipes?query=${encodeURIComponent(searchQuery)}`);
            setRecipes(response.data.recipes || []);
            if ((response.data.recipes || []).length === 0) {
                toast.info("No recipes found for that query.");
            }
        } catch (error) {
            console.error("Error searching recipes:", error);
            toast.error("Failed to fetch recipes. Please check your API key.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewRecipe = async (recipeId: number | string) => {
        setIsFetchingDetails(true);
        try {
            const response = await axios.get(`/api/getRecipeDetails/${recipeId}`);
            setSelectedRecipe(response.data);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching recipe details:", error);
            toast.error("Failed to load recipe details.");
        } finally {
            setIsFetchingDetails(false);
        }
    };

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
                    <h1 className="text-xl font-bold text-gray-900">Recipe Finder</h1>
                </div>
                <HamburgerMenu />
            </header>

            <main className="pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-10 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Find recipes (e.g., Pasta, Chicken, Salad...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white pl-10 h-14 rounded-2xl border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
                    </Button>
                </form>

                {/* Results */}
                {recipes.length === 0 && !isLoading ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                        <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                            <ChefHat className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Cook something amazing!</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Enter an ingredient or dish name above to discover delicious recipes you can make.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {recipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="aspect-4/3 relative overflow-hidden">
                                    <Image
                                     src={recipe.image}
                                     alt={recipe.title}
                                    fill
                                   className="object-cover transition-transform duration-500 group-hover:scale-110"
                                     />

                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <Button
                                            size="sm"
                                            className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl"
                                            onClick={() => handleViewRecipe(recipe.id)}
                                            disabled={isFetchingDetails}
                                        >
                                            {isFetchingDetails && selectedRecipe?.id === recipe.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "View Recipe"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                        {recipe.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 grayscale">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-200 mb-4" />
                        <p className="text-gray-400 font-medium animate-pulse">Searching for culinary inspiration...</p>
                    </div>
                )}
            </main>

            {/* Recipe Details Modal */}
            {showModal && selectedRecipe && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="relative h-64 sm:h-80 shrink-0">
                            <Image
                              src={selectedRecipe.image}
                              alt={selectedRecipe.title}
                              fill
                              className="object-cover"
                            />

                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="absolute bottom-6 left-6 right-6">
                                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                                    {selectedRecipe.title}
                                </h2>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                            <div className="grid gap-8">
                                {/* Ingredients */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                            <ChefHat className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Ingredients</h3>
                                    </div>
                                    <ul className="grid gap-3 sm:grid-cols-2">
                                        {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                                            <li key={index} className="flex items-start gap-3 text-gray-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                                                <span className="text-sm sm:text-base">{ingredient}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Instructions */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Instructions</h3>
                                    </div>
                                    <div
                                        className="prose prose-blue max-w-none text-gray-600 leading-relaxed space-y-4"
                                        dangerouslySetInnerHTML={{ __html: selectedRecipe.instructions }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 flex justify-end">
                            <Button
                                onClick={() => setShowModal(false)}
                                className="bg-gray-900 hover:bg-black text-white px-8 rounded-xl h-12 font-bold"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
