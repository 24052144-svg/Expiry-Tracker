"use client";

import React, { useState } from "react";
import { IKUpload } from "imagekitio-next";
import { Loader2 } from "lucide-react";
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";

interface FileUploadProps {
    onSuccess: (res: IKUploadResponse) => void;
    onProgress?: (progress: number) => void;
    fileType?: "image" | "video";
}


const publicKey = process.env.NEXT_PUBLIC_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

// Debug logs
// Debug logs removed

if (!publicKey) {
    console.error("Missing NEXT_PUBLIC_PUBLIC_KEY in environment variables");
}
if (!urlEndpoint) {
    console.error("Missing NEXT_PUBLIC_URL_ENDPOINT in environment variables");
}

const authenticator = async () => {
    try {
        const response = await fetch("/api/imagekit-auth");

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const { signature, expire, token } = data;
        return { signature, expire, token };
    } catch (error) {
        throw new Error(`Authentication request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export default function FileUpload({
    onSuccess,
    onProgress,
    fileType = "image"
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);



    const onError = (err: { message: string }) => {
        console.log("Error", err);
        setError(err.message);
        setUploading(false);
    };

    const handleSuccess = (response: IKUploadResponse) => {
        console.log("Success", response);
        setUploading(false);
        setError(null);
        onSuccess(response);
    };

    const handleProgress = (evt: ProgressEvent) => {
        if (evt.lengthComputable && onProgress) {
            const percentComplete = (evt.loaded / evt.total) * 100;
            onProgress(Math.round(percentComplete));
        }
    };

    const handleStartUpload = () => {
        setUploading(true);
        setError(null);
    };

    const validateFile = (file: File) => {
        if (fileType === "video") {
            if (!file.type.startsWith("video/")) {
                setError("Please upload a video file");
                return false;
            }
            if (file.size > 100 * 1024 * 1024) {
                setError("Video must be less than 100MB");
                return false;
            }
        } else {
            const validTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!validTypes.includes(file.type)) {
                setError("Please upload a valid file (JPEG, PNG, WebP)");
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Image must be less than 5MB");
                return false;
            }
        }
        return true;
    };

    return (
        <div className="w-full">
            <style jsx global>{`
                .file-upload-wrapper input[type="file"] {
                    width: 100%;
                    padding: 8px 12px;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #6b7280;
                    background-color: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    cursor: pointer;
                }
                
                .file-upload-wrapper input[type="file"]::file-selector-button {
                    margin-right: 12px;
                    padding: 6px 16px;
                    font-size: 14px;
                    font-weight: 400;
                    color: #374151;
                    background-color: #f3f4f6;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .file-upload-wrapper input[type="file"]::file-selector-button:hover {
                    background-color: #e5e7eb;
                }
            `}</style>

            <div className="file-upload-wrapper">
                <IKUpload
                    publicKey={publicKey}
                    urlEndpoint={urlEndpoint}
                    authenticator={authenticator}
                    fileName={fileType === "video" ? "video" : "image"}
                    onError={onError}
                    onSuccess={handleSuccess}
                    onUploadStart={handleStartUpload}
                    onUploadProgress={handleProgress}
                    accept={fileType === "video" ? "video/*" : "image/*"}
                    validateFile={validateFile}
                    useUniqueFileName={true}
                    folder={fileType === "video" ? "/videos" : "/images"}
                />
            </div>

            {uploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span>Uploading...</span>
                </div>
            )}

            {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
        </div>
    );
}