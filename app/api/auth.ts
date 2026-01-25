import jwt from "jsonwebtoken";

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  iat: number;
  exp: number;
}

export async function decodeToken(token: string) {
  if (!token || !process.env.SECRET_KEY) return null;
  
  const decoded = jwt.verify(token, process.env.SECRET_KEY) as DecodedToken;

  if (!decoded) return null;

  return decoded;
}
