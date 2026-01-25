"use client";

import { ImageKitProvider } from "imagekitio-next";
import React, { useState } from "react"; // { } becoz it is not default export rather it is a 
// named export , export something with a name, and import it using the same name inside { }

import { useForm } from "react-hook-form"; // Manages form state (inputs, errors, submission)
import { zodResolver } from "@hookform/resolvers/zod";// It takes your Zod schema and 
// converts it into a format that React Hook Form understands for validation errors.

import * as z from "zod"; //  This imports the entire Zod library and assigns it to the variable z.

import axios from "axios"; // axios → makes HTTP requests
import { toast } from "sonner"; // toast → shows success/error notifications
import { useRouter } from "next/navigation";// useRouter → client-side navigation (redirect)

import {  // Prebuilt form components
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

// Styled input fields and buttons
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { // Card layout for clean UI
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import FileUpload from "../components/fileUpload"; // Custom component for image upload

import { Calendar, Tag, Package, Hash, Loader2 } from "lucide-react"; //Icons used in input fields
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";
// type definition for successful image upload response, type definition meand blueprint of date with rules

const categories = [ // List of valid product categories, Used for dropdown & validation
    "non-veg",
    "medicine",
    "cosmetics",
    "dairy",
    "drinks",
    "groceries",
    "other",
];

const formSchema = z.object({ // Defines the shape and rules of form data.
    product_name: z.string().min(2, "Product name must be at least 2 characters"),
    category: z.enum([ // Only allows values from the given list
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
    // .refine(...): Runs a custom check function on that string.
    // Date.parse(val) tries to convert the string (like "2023-12-25") into a number (timestamp).



    image_url: z.string().optional(),// Optional field for image URL
});


// async function uploadImage(file: File): Promise<IKUploadResponse> {  // Uploading a file to a server
//     // file: File → the image selected by the user
//     const formData = new FormData(); // FormData is a special container
//     formData.append("file", file); // Appends the file to the form data

//     const res = await axios.post("/api/upload", formData, {  // send file to the server
//         headers: {
//             "Content-Type": "multipart/form-data",// This allows:images,videos,PDFs
//         },
//     });

//     return res.data; // response from server, contains:uploaded image URL,fileId,size,width / height
// }


export default function AddProductPage() {
    const router = useRouter(); // Used for redirecting after successful submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Tracks whether form is being submitted, Used to:Disable button,Show loader

    const form = useForm<z.infer<typeof formSchema>>({ // form data must match this exact shape
        resolver: zodResolver(formSchema), // This connects Zod validation to React Hook Form.
        // Without resolver, React Hook Form doesn’t know Zod rules
        defaultValues: {
            product_name: "",
            category: "other",
            quantity: 1, // Default as number, but input will be string controlled
            expiry_date: "",
            image_url: "",
        },
    });




    // It is async because you are sending data to a server (using axios.post), and that takes time.

    const onSubmit = async (values: z.infer<typeof formSchema>) => { // runs automatically when the user clicks "Submit" (and the form is valid).
        // z.infer<typeof formSchema>: instead of manually typing what values looks like, it automatically 
        // calculates the type based on the formSchema you wrote earlier. It ensures values matches your
        // schema exactly.

        setIsSubmitting(true);
        console.log("SUBMITTING PRODUCT VALUES:", values);
        try {
            const token = localStorage.getItem("token"); // Assuming token is in localStorage based on typical patterns, or handled via session.
            // The API route used `req.headers.get("Authorization")`.
            // I need to ensure I send the token. 
            // UserContext usually handles this, but for now I'll try getting it from local storage or session.
            // If the app uses NextAuth, I might need getSession.
            // Based on layout.tsx, it uses UserProvider. 
            // I'll assume usage of axios interceptors or simple localStorage for now.
            // If it fails, I'll notify user to login.

            // Checking existing API routes might clarify token usage, but let's try standard Bearer token from localStorage 'token' or 'authToken'.
            // I'll try to get it from localStorage first.

           if (!token) {
  toast.error("Please login again");
  return;
}

            const response = await axios.post("/api/createProduct", values, {// Sends product data to backend
                headers: {
                    Authorization: `Bearer ${token}`,// Adds token in Authorization header
                }
            });

            if (response.status === 201) {
                toast.success("Product added successfully!");
                router.push("/components/dashboard"); // Redirect to dashboard or list
                form.reset(); // Clears form inputs
            }
        } catch (error: unknown) {
           if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("Something went wrong");
  }

        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUploadSuccess = (res: IKUploadResponse) => {
        // The res (response) object contains the details of the uploaded image (from ImageKit).


        form.setValue("image_url", res.url);
        // // We only need the URL of the uploaded image, so we extract it using res.url.  

        toast.success("Image uploaded!");
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-transparent py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background effects could go here, but layout handles global bg */}


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
                        </CardTitle>
                        <CardDescription className="text-gray-900">
                            <h1 className="text-2xl font-semibold text-gray-900"> Add Item</h1>
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
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none translate-y-1px"
                                                    >
                                                        {categories.map((cat) => (
                                                            <option key={cat} value={cat} className="bg-gray-900 text-white">
                                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {/* Custom arrow could go here */}
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
                                    {form.getValues("image_url") && (
                                        <p className="text-xs text-green-600 mt-1">✓ Image uploaded successfully!</p>
                                    )}
                                </div>


                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"

                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                                        </>
                                    ) : (
                                        "Add Product"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </ImageKitProvider>
        </div>
    );
}
