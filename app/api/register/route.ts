import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import z from "zod";
import user from "@/app/models/user";
import bcrypt from "bcryptjs";

const reqSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();  

    const parsedBody = reqSchema.safeParse(body);
    if (!parsedBody.success) {
      console.log(parsedBody.error);
      return NextResponse.json(  
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { name, email, password, confirmPassword } = parsedBody.data;

    if (password !== confirmPassword)
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );

    const existingUser = await user.findOne({ email });
    if (existingUser)
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );

    const hashedPass = await bcrypt.hash(password, 12);

    const newUser = new user({
      name,
      email,
      password: hashedPass,
    });

    await newUser.save();

    return NextResponse.json(
      { message: "User registered successfully" },
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
