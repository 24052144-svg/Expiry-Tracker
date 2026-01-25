"use client";
import Image from "next/image";
import { ImageKitProvider } from "imagekitio-next";
import React, { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import FileUpload from "../../components/fileUpload";
import { Calendar, Tag, Package, Hash, Loader2 } from "lucide-react";
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";

const categories = [
    "non-veg",
    "medicine",
    "cosmetics",
    "dairy",
    "drinks",
    "groceries",
    "other",
];

const formSchema = z.object({
    product_name: z.string().min(2, "Product name must be at least 2 characters"),
    category: z.enum([
        "non-veg",
        "medicine",
        "cosmetics",
        "dairy",
        "drinks",
        "groceries",
        "other",
    ]),
    quantity: z.number().positive("Quantity must be greater than 0"),
    expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    image_url: z.string().optional(),
});

interface Props {
    params: Promise<{ productId: string }>;
}

export default function EditItemPage({ params }: Props) {
    const { productId } = use(params);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            product_name: "",
            category: "other",
            quantity: 1,
            expiry_date: "",
            image_url: "",
        },
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`/api/getProduct/${productId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    const product = response.data;
                    // Format date to YYYY-MM-DD for input type="date"
                    const formattedDate = product.expiry_date ? new Date(product.expiry_date).toISOString().split('T')[0] : "";

                    form.reset({
                        product_name: product.product_name,
                        category: product.category,
                        quantity: product.quantity,
                        expiry_date: formattedDate,
                        image_url: product.image_url || "",
                    });
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                toast.error("Failed to load product details");
                router.push("/dashboard");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId, form, router]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(`/api/updateProduct/${productId}`, values, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                toast.success("Product updated successfully!");
                router.push("/components/dashboard");
            }
        } catch (error: unknown) {
           console.error(error);

    if (axios.isAxiosError(error)) {
        toast.error(
            (error.response?.data as { message?: string })?.message ||
            "Failed to update product"
        );
    } else {
        toast.error("Failed to update product");
    }
} finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUploadSuccess = (res: IKUploadResponse) => {
        form.setValue("image_url", res.url);
        toast.success("Image uploaded!");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-transparent py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <ImageKitProvider
                publicKey={process.env.NEXT_PUBLIC_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                urlEndpoint={process.env.NEXT_PUBLIC_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                authenticator={async () => {
                    const response = await fetch("/api/imagekit-auth");
                    return response.json();
                }}
            >
                <Card className="w-full max-w-2xl bg-white shadow-lg rounded-2xl">
                    <CardHeader className="space-y-1 text-center pb-6 border-b">
                        <CardTitle className="text-2xl font-semibold text-gray-900">
                            Edit Item
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Update your product details below.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="product_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 flex items-center gap-2">
                                                    <Package className="w-4 h-4" /> Product Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Organic Milk"
                                                        {...field}
                                                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 flex items-center gap-2">
                                                    <Tag className="w-4 h-4" /> Category
                                                </FormLabel>
                                                <div className="relative">
                                                    <select
                                                        {...field}
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200"
                                                    >
                                                        {categories.map((cat) => (
                                                            <option key={cat} value={cat}>
                                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 flex items-center gap-2">
                                                    <Hash className="w-4 h-4" /> Quantity
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="expiry_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" /> Expiry Date
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <FormLabel className="text-gray-700 flex items-center gap-2">
                                        Product Image
                                    </FormLabel>
                                    <FileUpload onSuccess={handleImageUploadSuccess} />
                                    {form.watch("image_url") && (
                                        <div className="mt-4">
                                            <Image
                                                src={form.watch("image_url")!}
                                                alt="Current product"
                                                width={96}
                                                height={96}
                                                className="object-cover rounded-lg border border-gray-200"
                                            />

                                            <p className="text-xs text-green-600 mt-1">✓ Image uploaded successfully!</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 h-12 rounded-xl font-medium transition-all duration-200"
                                        onClick={() => router.push("/components/dashboard")}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                                            </>
                                        ) : (
                                            "Update Product"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </ImageKitProvider >
        </div >
    );
}
