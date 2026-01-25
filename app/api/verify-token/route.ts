import { NextResponse } from "next/server";

export async function GET() {
    // Temporary dummy response
    return NextResponse.json({
        success: true,
        user: null, // or fake user if needed
    });
}
