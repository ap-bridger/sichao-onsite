import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  return NextResponse.json(
    { id: Date.now(), name: name as string },
    { status: 201 }
  );
}
