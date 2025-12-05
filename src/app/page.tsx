import Link from "@/components/Link";

import { auth, signOut } from "@/lib/auth";

import Button from "@mui/material/Button";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

export default async function Home() {
  const session = await auth();
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-16 p-8 font-sans sm:p-20">
      <header className="flex w-full flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold">Upload Pics</h1>
        <hr className="border-[#d4d4d4] dark:border-[#383838]" />
      </header>
      <main className="flex flex-col items-center gap-4">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold">Home</h2>
          <p className="text-[#575757] dark:text-[#b9b9b9]">
            Easily upload and store your images — either permanently or
            temporarily. Perfect for quick temporary sharing or building a
            lasting image library.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            LinkComponent={Link}
            href="/dashboard"
            variant="outlined"
            startIcon={<DashboardRoundedIcon />}
          >
            Dashboard
          </Button>
          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button
                variant="contained"
                color="error"
                startIcon={<LogoutRoundedIcon />}
                type="submit"
              >
                Sign Out
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
