import { NextResponse } from "next/server";
import { createMood, listMoods } from "@/lib/moods";
import { ZodError } from "zod";

export async function GET() {
  try {
    const data = await listMoods();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to list moods", error);
    return NextResponse.json(
      { error: "Unable to load mood entries. Check your database connection." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = await createMood(payload);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    console.error("Failed to create mood entry", error);
    return NextResponse.json(
      { error: "Unable to create the entry. Check your database connection." },
      { status: 500 }
    );
  }
}
