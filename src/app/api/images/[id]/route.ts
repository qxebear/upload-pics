import { type NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { redisConnect } from "@/lib/redis";

const LIST_KEY = "uploads:list";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await isAuthenticated(req);
  if (!session) {
    return NextResponse.json(
      { error: { message: "Unauthorized" }, success: false },
      { status: 401 },
    );
  }

  try {
    const { id } = params;
    const redis = await redisConnect();

    const rawList = await redis.lRange(LIST_KEY, 0, -1);

    const target = rawList.find((entry) => {
      try {
        const parsed = JSON.parse(entry);
        return parsed.id === id;
      } catch {
        return false;
      }
    });

    if (!target) {
      return NextResponse.json(
        { error: { message: "Not found" }, success: false },
        { status: 404 },
      );
    }

    // Remove from list
    await redis.lRem(LIST_KEY, 0, target);

    // Delete file data
    await redis.del(`uploads:images:${id}`);

    // Delete expiration tracking key if it exists
    await redis.del(`uploads:expire:${id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: { message: "Failed to delete file" }, success: false },
      { status: 500 },
    );
  }
}
