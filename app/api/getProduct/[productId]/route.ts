import { connectDB } from "@/app/api/mongodb";
import Product from "../../../models/product";
import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/app/api/auth";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ productId: string }> }
) {
    const params = await context.params;
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        const decodedToken = await decodeToken(token);
        if (!decodedToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = params.productId;
        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // Find the product and ensure it belongs to the decoded user
        const product = await Product.findOne({
            _id: productId,
            userId: decodedToken.id
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(product, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
