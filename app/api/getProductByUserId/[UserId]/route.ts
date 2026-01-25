import { connectDB } from "@/app/api/mongodb";
import Product from "../../../models/product";
import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/app/api/auth";
import user from "@/app/models/user";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ UserId: string }> }
) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const decodedToken = await decodeToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { UserId } = await params;
    console.log(UserId);
    const userId = await user.findById(decodedToken.id);

    if (!userId) {
      // console.log(userId);
      return NextResponse.json(
        { error: "user id is required" },
        { status: 400 }
      );
    }

    const products = await Product.find({ userId });

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No product found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ products }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
