import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redisConnect } from "@/lib/redis";
import { isAuthenticated } from "@/lib/auth";

const LIST_KEY = "uploads:list";
const MAX_UPLOADS = 5;

interface FilesList {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  date: string;
}

interface ListEntry {
  id: string;
  filename: string;
}

async function cleanupExpiredEntries(redis: any) {
  const rawList = await redis.lRange(LIST_KEY, 0, -1);
  const expiredEntries: string[] = [];

  for (const item of rawList) {
    try {
      const { id } = JSON.parse(item) as ListEntry;
      const exists = await redis.exists(`uploads:images:${id}`);
      if (!exists) {
        expiredEntries.push(item);
      }
    } catch {
      expiredEntries.push(item);
    }
  }

  for (const expiredItem of expiredEntries) {
    await redis.lRem(LIST_KEY, 0, expiredItem);
  }

  return expiredEntries.length;
}

export async function GET(req: NextRequest) {
  const session = await isAuthenticated(req);
  if (!session) {
    return NextResponse.json(
      { error: { message: "Unauthorized" }, success: false },
      { status: 401 },
    );
  }

  try {
    const redis = await redisConnect();

    await cleanupExpiredEntries(redis);

    const rawList = await redis.lRange(LIST_KEY, 0, -1);
    const files: FilesList[] = [];

    for (const item of rawList) {
      const { id, filename: originalName } = JSON.parse(item) as ListEntry;
      const raw = await redis.get(`uploads:images:${id}`);
      if (!raw) continue;

      const { filename, mimeType, date } = JSON.parse(raw);
      files.push({
        id,
        filename,
        originalName,
        url: `/images/${filename}`,
        mimeType,
        date,
      });
    }

    return NextResponse.json({ success: true, files });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: { message: "Failed to list images" }, success: false },
      { status: 500 },
    );
  }
}

// POST /api/images
export async function POST(req: NextRequest) {
  const session = await isAuthenticated(req);
  if (!session) {
    return NextResponse.json(
      { error: { message: "Unauthorized" }, success: false },
      { status: 401 },
    );
  }

  try {
    const redis = await redisConnect();

    await cleanupExpiredEntries(redis);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawTtl = formData.get("ttl") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: { message: "No file provided" }, success: false },
        { status: 400 },
      );
    }

    let ttl: number | null = null;
    if (rawTtl) {
      const parsedTtl = parseInt(rawTtl.toString(), 10);
      if (!isNaN(parsedTtl) && parsedTtl > 0) {
        ttl = parsedTtl;
      } else if (rawTtl.toString() !== "0") {
        return NextResponse.json(
          {
            error: {
              message:
                "Invalid TTL value. Must be a positive number or 0 for no expiration.",
            },
            success: false,
          },
          { status: 400 },
        );
      }
    } else {
      ttl = null;
    }

    const count = await redis.lLen(LIST_KEY);
    if (count >= MAX_UPLOADS) {
      return NextResponse.json(
        { error: { message: "Upload limit reached" }, success: false },
        { status: 400 },
      );
    }

    const existing = await redis.lRange(LIST_KEY, 0, -1);
    for (const entry of existing) {
      const parsed: ListEntry = JSON.parse(entry);
      if (parsed.filename === file.name) {
        const exists = await redis.exists(`uploads:images:${parsed.id}`);
        if (exists) {
          return NextResponse.json(
            { error: { message: "Duplicate filename" }, success: false },
            { status: 400 },
          );
        }
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = randomUUID();
    const filename = file.name;
    const ext = filename.split(".").pop() || "dat";
    const date = new Date().toISOString();

    const fileData = {
      id,
      filename,
      mimeType: file.type,
      date,
      data: buffer.toString("base64"),
    };

    await redis.set(`uploads:images:${id}`, JSON.stringify(fileData), {
      ...(ttl && { EX: ttl }),
    });

    const listEntry = JSON.stringify({ id, filename: file.name });
    await redis.rPush(LIST_KEY, listEntry);

    if (ttl) {
      await redis.set(`uploads:expire:${id}`, "1", { EX: ttl });
    }

    return NextResponse.json({
      success: true,
      ...fileData,
      url: `/images/${filename}`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: { message: "Upload failed" }, success: false },
      { status: 500 },
    );
  }
}
