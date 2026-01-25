import { useEffect, type ReactNode } from "react";

import { ImageKitProvider } from "imagekitio-next";
import { SessionProvider } from "next-auth/react";


const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT;
const publicKey = process.env.NEXT_PUBLIC_PUBLIC_KEY;

export default function Providers({ children }: { children: ReactNode }) {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registered with scope:", registration.scope);
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
        }
    }, []);

    const authenticator = async () => {

        try {
            const response = await fetch("/api/imagekit-auth");

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(` Request failed with status ${response.status}: ${errorText}`
                );
            }
            const data = await response.json();
            const { signature, expire, token } = data;
            return { signature, expire, token };

        }
        catch (error) {
            console.log(error)
            throw new Error(`ImageKit Authentication request failed:`)
        }
    };



    return (
        <SessionProvider>

            <ImageKitProvider
                urlEndpoint={urlEndpoint}
                publicKey={publicKey}
                authenticator={authenticator}
            >

                {/* ...client side upload component goes here */}
                {children}
            </ImageKitProvider>
        </SessionProvider>
    );
    {/* ...other SDK components added previously */ }

}

// whatever component given, wrapped in provider