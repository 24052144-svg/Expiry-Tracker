import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import z from "zod";
import Product from "../../models/product";
import { decodeToken } from "@/app/api/auth";
import User from "../../models/user";

const reqSchema = z.object({  //  schema which validates using  zod
  product_name: z.string(),
  quantity: z.number(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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


export async function POST(req: NextRequest) { // nextreq contains info about the request which comes from frontend
  // api called from client side 
  const token = req.headers.get("Authorization")?.split(" ")[1];
  // Authorization token in the request headers.
  // ?->op


  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const decodedToken = await decodeToken(token);
    if (!decodedToken)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const current_user = await User.findById(decodedToken.id);
    if (!current_user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const parsedBody = reqSchema.safeParse(body);
    if (!parsedBody.success) {
      console.log(parsedBody.error);
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }


    const { product_name, quantity, expiry_date, category, image_url } = parsedBody.data;

    console.log("CREATING PRODUCT WITH DATA:", {
      product_name,
      quantity,
      expiry_date,
      category,
      image_url,
      userId: current_user._id
    });

    const newProduct = new Product({
      product_name,
      quantity,
      expiry_date,
      category,
      image_url,
      userId: current_user._id, // Assigns the ID of the logged-in user to this journal entry,
      //  This links the journal entry to the user who created it.
    });

    await newProduct.save();

    return NextResponse.json(
      { message: "Product created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
