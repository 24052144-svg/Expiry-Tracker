import { connectDB } from "@/app/api/mongodb";
import Product from "../../../models/product";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { decodeToken } from "@/app/api/auth";


const reqSchema = z.object({
  product_name: z.string().optional(),
  quantity: z.number().optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.enum([
    "non-veg",
    "medicine",
    "cosmetics",
    "dairy",
    "drinks",
    "groceries",
    "other",
  ]),
  image_url: z.string().optional(),
});


export async function PUT(req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const params = await context.params;
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token)

    return NextResponse.json({ message: "Unauthorized" },
      { status: 401 });

  try {
    await connectDB();

    const decodedToken = await decodeToken(token);
    if (!decodedToken)

      return NextResponse.json({ error: "Unauthorized" },
        { status: 401 });

    const productId = params.productId;
    if (!productId)
      return NextResponse.json({ message: "Product ID is required" },
        { status: 400 });

    const body = await req.json();

    const parsedBody = reqSchema.safeParse(body);
    if (!parsedBody.success) {
      console.log(parsedBody.error);

      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product)
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: parsedBody.data },
      { new: true }
    );


    if (!updatedProduct)
      return NextResponse.json(
        { message: "Failed to update Product" },
        { status: 500 }
      );

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}



