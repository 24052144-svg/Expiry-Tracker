import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../mongodb";
import User from "../../models/user";
import Product from "../../models/product";
import { decodeToken } from "../auth";

export async function DELETE(req: NextRequest) {
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const decodedToken = await decodeToken(token);

        if (!decodedToken || !decodedToken.id) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const userId = decodedToken.id;

        // 1. Delete all products belonging to the user
        await Product.deleteMany({ userId });

        // 2. Delete the user
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Account and associated data deleted successfully"
        });

    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
