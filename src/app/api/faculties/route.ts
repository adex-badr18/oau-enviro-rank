import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkAuth } from "@/utils/supabase/check-auth";

// Zod schema for validation
const CreateFacultySchema = z.object({
  name: z.string().min(2, "Faculty name must be at least 2 characters"),
  buildingName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

// GET: Retrieve all faculties
export async function GET() {
  try {
    const faculties = await prisma.faculty.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(faculties);
  } catch (error: any) {
    console.error("GET faculties error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new faculty
export async function POST(request: NextRequest) {
  const auth = await checkAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const result = CreateFacultySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation Error", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, buildingName, description } = result.data;

    // Check if name already exists
    const existing = await prisma.faculty.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Conflict", message: `Faculty with name "${name}" already exists` },
        { status: 409 }
      );
    }

    const faculty = await prisma.faculty.create({
      data: {
        name,
        buildingName,
        description,
        currentScore: 0.0,
      },
    });

    return NextResponse.json(faculty, { status: 201 });
  } catch (error: any) {
    console.error("POST faculties error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
