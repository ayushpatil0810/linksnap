import { db } from "@/db";
import { links } from "@/db/schema/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Helper function to get current user from session
async function getCurrentUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user;
}

// GET → retrieve a specific link by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Check if link belongs to user
    if (link.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(link);
  } catch (error) {
    console.error("Error fetching link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
