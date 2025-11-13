import { NextResponse } from "next/server";
import { deleteMood, updateMood } from "@/lib/moods";
import { ZodError } from "zod";

type Params = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const payload = await request.json();
    const data = await updateMood(params.id, payload);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Entry not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(`Failed to update mood entry ${params.id}`, error);
    return NextResponse.json(
      { error: "Unable to update the entry. Check your database connection." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await deleteMood(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Entry not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(`Failed to delete mood entry ${params.id}`, error);
    return NextResponse.json(
      { error: "Unable to delete the entry. Check your database connection." },
      { status: 500 }
    );
  }
}
