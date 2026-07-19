import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Endpoint not implemented" },
    { status: 501 }
  );
}

export async function POST(request: Request) {
  return NextResponse.json(
    { error: "Endpoint not implemented" },
    { status: 501 }
  );
}
