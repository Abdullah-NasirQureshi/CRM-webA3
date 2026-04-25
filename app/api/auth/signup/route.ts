import { NextRequest, NextResponse } from "next/server";
import { signup, AuthError } from "@/services/authService";
import { signupSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        fields[e.path.join(".")] = e.message;
      });
      return NextResponse.json(
        { error: "Validation failed", fields },
        { status: 400 }
      );
    }

    const user = await signup(parsed.data);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
