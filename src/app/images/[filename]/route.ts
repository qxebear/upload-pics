import { redisConnect } from "@/lib/redis";
import { type NextRequest, NextResponse } from "next/server";

const LIST_KEY = "uploads:list";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    const redis = await redisConnect();

    const decodedFilename = decodeURIComponent(filename);

    const rawList = await redis.lRange(LIST_KEY, 0, -1);
    const entry = rawList.find((item) => {
      try {
        const parsed = JSON.parse(item);
        return parsed.filename === decodedFilename;
      } catch {
        return false;
      }
    });

    if (!entry) {
      return NextResponse.json(
        { error: { message: "File not found" }, success: false },
        { status: 404 },
      );
    }

    const { id } = JSON.parse(entry);

    const raw = await redis.get(`uploads:images:${id}`);
    if (!raw) {
      return NextResponse.json(
        { error: { message: "File not found" }, success: false },
        { status: 404 },
      );
    }

    const { data, mimeType, date } = JSON.parse(raw);
    const buffer = Buffer.from(data, "base64");

    const etag = `"${id}"`;
    const lastModified = new Date(date).toUTCString();

    const ifNoneMatch = req.headers.get("if-none-match");
    const ifModifiedSince = req.headers.get("if-modified-since");

    if (ifNoneMatch === etag || ifModifiedSince === lastModified) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Last-Modified": lastModified,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(decodedFilename)}`,
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: { message: "Failed to fetch image" }, success: false },
      { status: 500 },
    );
  }
}
