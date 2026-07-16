import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("oau_session")?.value;
    
    if (!token) {
      return NextResponse.json({ role: null });
    }

    const payload = verifyToken(token);
    return NextResponse.json({ role: payload?.role || null });
  } catch (error: any) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ role: null }, { status: 500 });
  }
}
