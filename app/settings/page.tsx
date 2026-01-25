"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Bell,
    Mail,
    Smartphone,
    Save,
    Loader2,
    Clock,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import HamburgerMenu from "../components/HamburgerMenu";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "@/components/UserContext";

const VAPID_PUBLIC_KEY = "BLUAm7nXtNQLl47XooQ5wPx0jFc5ZMSHnaJyP4cq7buwfIIuN-K-FpMR4VYWA3fay-D1483IWycz1HTltFdxBNw";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function SettingsPage() {
    const router = useRouter();
    const { refreshUser } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);

    const [settings, setSettings] = useState({
        reminderDays: 7,
        notificationChannel: "email" as "email" | "push",
        emailReminder: true,
    });
    const [isCustomThreshold, setIsCustomThreshold] = useState(false);
    const [configStatus, setConfigStatus] = useState({ smtpConfigured: false, pushConfigured: false });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    router.push("/login");
                    return;
                }

                const [userRes, configRes] = await Promise.all([
                    axios.get("/api/user", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/checkConfig")
                ]);

                if (userRes.data.success) {
                    const userData = userRes.data.data;
                    setSettings({
                        reminderDays: userData.reminderDays ?? 7,
                        notificationChannel: userData.notificationChannel ?? "email",
                        emailReminder: userData.emailReminder ?? true,
                    });
                }
                setConfigStatus(configRes.data);
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast.error("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");

            if (settings.notificationChannel === "push") {
                if (!("Notification" in window) || !("serviceWorker" in navigator)) {
                    toast.error("Web Push is not supported in this browser");
                    setIsSaving(false);
                    return;
                }

                console.log("Push selected, requesting permission...");
                const permission = await Notification.requestPermission();
                console.log("Permission status:", permission);
                if (permission !== "granted") {
                    toast.error("Notification permission denied");
                    setIsSaving(false);
                    return;
                }

                console.log("Waiting for SW ready (with timeout)...");
                // 10s timeout for SW ready
                const swTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("SW_TIMEOUT")), 10000));

                try {
                    // Proactively register again if not found to kickstart it
                    const existingReg = await navigator.serviceWorker.getRegistration();
                    if (!existingReg) {
                        console.log("No existing registration found, registering now...");
                        await navigator.serviceWorker.register("/sw.js");
                    }

                    const registration = await Promise.race([navigator.serviceWorker.ready, swTimeout]) as ServiceWorkerRegistration;
                    console.log("SW ready, checking subscription...");
                    let subscription = await registration.pushManager.getSubscription();
                    console.log("Existing subscription:", subscription);

                    if (!subscription) {
                        console.log("Subscribing to push...");
                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                        });
                        console.log("New subscription created:", subscription);
                    }

                    console.log("Sending subscription to server...");
                    await axios.post("/api/subscribe", { subscription }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log("Subscription saved successfully");
                } catch (swErr: unknown) {
                   console.error("Push registration error:", swErr);

    if (swErr instanceof Error && swErr.message === "SW_TIMEOUT") {
        toast.error("Background service is taking too long. Please refresh the page and try again.");
    } else {
        toast.error("Failed to enable Web Push. Saving other settings...");
    }
}
            }

            await axios.put("/api/updateSettings", settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshUser(false);
            toast.success("Settings updated successfully!");
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
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
                    <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                </div>
                <HamburgerMenu />
            </header>

            <main className="pt-24 pb-12 px-4 md:px-8 max-w-2xl mx-auto">
                <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-white pb-2">
                            <CardTitle className="text-2xl font-bold">Preferences</CardTitle>
                            <CardDescription>
                                Customize how and when you receive expiry notifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            {/* Reminder Threshold */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-900">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Reminder Threshold</h3>
                                        <p className="text-sm text-gray-500">How many days before expiry should we alert you?</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pl-13">
                                    {!isCustomThreshold ? (
                                        <select
                                            value={settings.reminderDays}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "custom") {
                                                    setIsCustomThreshold(true);
                                                } else {
                                                    setSettings({ ...settings, reminderDays: parseInt(val) });
                                                }
                                            }}
                                            className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-lg font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                        >
                                            {Array.from(new Set([3, 7, 15, 30, 60, 90, 365, settings.reminderDays])).sort((a, b) => a - b).map((d) => (
                                                <option key={d} value={d}>
                                                    {d} Days
                                                </option>
                                            ))}
                                            <option value="custom">Custom...</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={settings.reminderDays}
                                                onChange={(e) => setSettings({ ...settings, reminderDays: parseInt(e.target.value) || 1 })}
                                                autoFocus
                                                className="w-24 h-12 rounded-xl text-lg font-semibold text-center focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => setIsCustomThreshold(false)}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                    <span className="text-gray-600 font-medium">before expiry</span>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Notification Channel */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-gray-900">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Notification Channel</h3>
                                        <p className="text-sm text-gray-500">Choose where you want to receive alerts.</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 pl-13">
                                    <button
                                        type="button"
                                        onClick={() => setSettings({ ...settings, notificationChannel: "email" })}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${settings.notificationChannel === "email"
                                            ? "border-blue-600 bg-blue-50/50"
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mail className={`w-5 h-5 ${settings.notificationChannel === "email" ? "text-blue-600" : "text-gray-400"}`} />
                                            <div className="text-left">
                                                <div className="font-bold text-gray-900">Email Notification</div>
                                                <div className="text-xs text-gray-500">Get alerts in your inbox</div>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${settings.notificationChannel === "email" ? "border-blue-600" : "border-gray-200"}`}>
                                            {settings.notificationChannel === "email" && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSettings({ ...settings, notificationChannel: "push" })}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${settings.notificationChannel === "push"
                                            ? "border-blue-600 bg-blue-50/50"
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Smartphone className={`w-5 h-5 ${settings.notificationChannel === "push" ? "text-blue-600" : "text-gray-400"}`} />
                                            <div className="text-left">
                                                <div className="font-bold text-gray-900">Web Push</div>
                                                <div className="text-xs text-gray-500">Direct notifications in browser</div>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${settings.notificationChannel === "push" ? "border-blue-600" : "border-gray-200"}`}>
                                            {settings.notificationChannel === "push" && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                                        </div>
                                    </button>

                                    {settings.notificationChannel === "email" && (
                                        <div className="mt-2 pl-4 space-y-4">
                                            {!configStatus.smtpConfigured && (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex gap-3">
                                                    <div className="mt-0.5">⚠️</div>
                                                    <div className="flex-1">
                                                        <p className="font-bold mb-1">Email service not configured</p>
                                                        <p className="opacity-90">Please add your SMTP credentials to the <code className="bg-amber-100 px-1 rounded">.env</code> file to enable email notifications.</p>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await axios.get("/api/checkConfig");
                                                                    setConfigStatus(res.data);
                                                                    if (res.data.smtpConfigured) toast.success("Configuration detected!");
                                                                    else toast.info("Still not configured. Did you restart the server?");
                                                                } catch  {
                                                                    toast.error("Failed to check configuration.");
                                                                }
                                                            }}
                                                            className="mt-2 text-xs font-bold underline hover:text-amber-600"
                                                        >
                                                            Refresh Status
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={async () => {
                                                    setIsSendingTest(true);
                                                    try {
                                                        const token = localStorage.getItem("token");
                                                        const res = await axios.post("/api/testEmail", {}, {
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        });
                                                        if (res.data.success) {
                                                            toast.success("Test email sent!");
                                                        }
                                                    } catch (err: unknown) {
                                                        console.error(err);

                                                       if (axios.isAxiosError(err)) {
                                                      const errorMessage = err.response?.data?.error || "Failed to send test email.";
                                                        toast.error(errorMessage);

                                                       if (err.response?.data?.details) {
                                                        toast.info(err.response.data.details);
                                                        }
                                                       } else {
                                                       toast.error("Failed to send test email.");
                                                        }
                                                       } finally {
                                                        setIsSendingTest(false);
                                                    }
                                                }}
                                                disabled={isSendingTest || !configStatus.smtpConfigured}
                                                className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 h-10 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                                                Send Test Email
                                            </Button>
                                        </div>
                                    )}

                                    {settings.notificationChannel === "push" && (
                                        <div className="mt-2 pl-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={async () => {
                                                    setIsSendingTest(true);
                                                    try {
                                                        const token = localStorage.getItem("token");
                                                        const res = await axios.post("/api/testPush", {}, {
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        });
                                                        if (res.data.success) {
                                                            toast.success("Test notification sent!");
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        toast.error("Failed to send test notification. Make sure you've saved settings first.");
                                                    } finally {
                                                        setIsSendingTest(false);
                                                    }
                                                }}
                                                disabled={isSendingTest}
                                                className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 h-10"
                                            >
                                                {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                                                Send Test Notification
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Settings</>}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                            <p className="text-blue-100 opacity-90 max-w-sm">
                                If you are not receiving your notifications, please check your browser settings or spam folder.
                            </p>
                        </div>
                        <Bell className="absolute -bottom-8 -right-8 w-40 h-40 text-blue-500 opacity-20 rotate-12" />
                    </div>
                </div>
            </main>
        </div>
    );
}
