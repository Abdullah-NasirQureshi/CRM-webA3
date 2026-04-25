import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "@/models/User";
import { connectDB } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export interface AuthPayload {
  userId: string;
  role: "admin" | "agent";
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "agent";
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function signup(input: SignupInput): Promise<IUser> {
  await connectDB();

  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new AuthError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role ?? "agent",
  });

  return user;
}

export async function login(input: LoginInput): Promise<{ token: string; user: IUser }> {
  await connectDB();

  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user) {
    throw new AuthError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password", 401);
  }

  const payload: AuthPayload = {
    userId: user._id.toString(),
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

  return { token, user };
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw new AuthError("Token expired", 401);
    }
    throw new AuthError("Invalid token", 401);
  }
}
