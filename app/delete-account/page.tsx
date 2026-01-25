"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {  ChevronLeft, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "@/components/UserContext";

export default function DeleteAccountPage() {
    const router = useRouter();
    const { setUser } = useUser();
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");

    const handleDelete = async () => {
        if (confirmationText !== "DELETE") {
            toast.error("Please type DELETE to confirm");
            return;
        }

        setIsDeleting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const response = await axios.delete("/api/deleteAccount", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success("Your account has been deleted");
                // Clear local state and storage
                setUser(null);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/login");
            }
        } catch (error: unknown) {
           console.error("Delete account error:", error);

    if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to delete account");
    } else {
        toast.error("Failed to delete account");
    }
} finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 md:px-6 sticky top-0 z-50">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Delete Account</h1>
            </header>

            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                <Card className="w-full max-w-md border-none shadow-xl rounded-3xl overflow-hidden">
                    <div className="h-2 bg-red-600 w-full" />
                    <CardHeader className="text-center pt-8">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Final Warning</CardTitle>
                        <CardDescription className="text-gray-500 mt-2">
                            This action is permanent and cannot be undone.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-2">
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-800 text-sm space-y-2">
                            <div className="flex items-center gap-2 font-bold">
                                <AlertTriangle className="w-4 h-4" />
                                <span>What happens next:</span>
                            </div>
                            <ul className="list-disc list-inside opacity-90 space-y-1">
                                <li>All your tracked products will be deleted.</li>
                                <li>Your reminder settings will be removed.</li>
                                <li>Your profile will be permanently erased.</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700 ml-1">
                                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                            </label>
                            <input
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                placeholder="Type DELETE here"
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none font-semibold transition-all uppercase placeholder:normal-case"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleDelete}
                                disabled={isDeleting || confirmationText !== "DELETE"}
                                className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>Delete My Account Permanently</>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => router.back()}
                                className="h-12 rounded-xl text-gray-500 hover:text-gray-900 font-semibold"
                            >
                                Actually, keep it
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
