import ImageKit from "imagekit"
import { NextResponse } from "next/server";

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!, // identifies your ImageKit account
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!, // signs upload requests
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!, // Base URL for serving images/videos
});
export async function GET() {

    try {
        const authenticationParameters = imagekit.getAuthenticationParameters()
        // ImageKit generates:token,expire,signature---used by the client to upload files securely

        return NextResponse.json(authenticationParameters);
    }
    catch (error) {
        console.error("ImageKit Auth Error:", error);
        return NextResponse.json(
            { error: "Imagekit Auth Failed" },

            { status: 500 }
        )
    }
}
// overall uploading with the help of imagekit

