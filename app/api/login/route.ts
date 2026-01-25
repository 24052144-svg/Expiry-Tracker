import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import z from "zod";
//import User from "@/models/user";
import User from "../../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const reqSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const parsedBody = reqSchema.safeParse(body);
    if (!parsedBody.success)
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );

    const { email, password } = parsedBody.data;  // safely extract email and password

    const user = await User.findOne({ email }); // looking for that particular user in database

    if (!user)  // particular user with a particular email id
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );

    const isValidPassword = await bcrypt.compare(password, user.password);
    // user.password is the hashed password stored in the database

    if (!isValidPassword)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );

    if (!process.env.SECRET_KEY) throw new Error("No secret key found");
    // safety check to make sure a required environment variable exists before your app continues.

    const token = jwt.sign(   
      {
        id: user._id,  
        name: user.name,
        email: user.email,
      },
      process.env.SECRET_KEY,  
      { expiresIn: "72h" } 
    );

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
    // confirms a successful login and returns the JWT plus safe user details for client-side use.    
       
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}