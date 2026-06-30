import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateFacultySchema = z.object({
  name: z.string().min(2, "Faculty name must be at least 2 characters").optional(),
  buildingName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

// PATCH: Update an existing faculty's details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = UpdateFacultySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation Error", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, buildingName, description } = result.data;

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Not Found", message: `Faculty with ID "${id}" not found` },
        { status: 404 }
      );
    }

    // Check for unique name conflict if name is updated
    if (name && name !== faculty.name) {
      const conflict = await prisma.faculty.findUnique({
        where: { name },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Conflict", message: `Faculty with name "${name}" already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.faculty.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        buildingName: buildingName !== undefined ? buildingName : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`PATCH faculty error for ID:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete an existing faculty
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Not Found", message: `Faculty with ID "${id}" not found` },
        { status: 404 }
      );
    }

    // Delete faculty (cascades related inspections and votes in the database)
    await prisma.faculty.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `Faculty "${faculty.name}" and all associated responses/inspections deleted successfully`,
    });
  } catch (error: any) {
    console.error(`DELETE faculty error for ID:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
