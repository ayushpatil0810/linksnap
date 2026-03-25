import { db } from "@/db";
import { links } from "@/db/schema/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Helper function to get current user from session
async function getCurrentUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user;
}

// GET → retrieve all links for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.userId, user.id))
      .orderBy(desc(links.createdAt));

    return NextResponse.json(userLinks);
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST → create a new link
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, title, description } = await request.json();

    // Validate input
    if (!url || !title) {
      return NextResponse.json(
        { error: "URL and title are required" },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // Create the new link
    const [newLink] = await db
      .insert(links)
      .values({
        id: uuidv4(),
        userId: user.id,
        url,
        title,
        description: description || null,
      })
      .returning();

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH → update a link
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, url, title, description } = await request.json();

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 },
      );
    }

    // Validate URL format if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 },
        );
      }
    }

    // Check if link exists and belongs to user
    const [existingLink] = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);

    if (!existingLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (existingLink.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (url !== undefined) updateData.url = url;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    // Update the link
    const [updatedLink] = await db
      .update(links)
      .set(updateData)
      .where(eq(links.id, id))
      .returning();

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE → delete a link
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 },
      );
    }

    // Check if link exists and belongs to user
    const [existingLink] = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);

    if (!existingLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (existingLink.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the link
    await db.delete(links).where(eq(links.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
