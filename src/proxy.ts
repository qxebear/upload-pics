import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { v4 as uuidv4 } from "uuid";

export default auth(async function middleware(req: NextRequest) {
  return NextResponse.next();
});

export const config = {
  matcher: ["/:path*", "/dashboard"],
};
