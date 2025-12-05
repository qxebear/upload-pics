import { type Metadata } from "next";
import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Button from "@mui/material/Button";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import { AuthError } from "next-auth";

const name = "";

export const metadata: Metadata = {
  title: "Login - Upload Pics",
};

const SIGNIN_ERROR_URL = "/auth/error";

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl: string | undefined }>;
}) {
  const session = await auth();

  const searchParams = await props.searchParams;

  if (session) {
    return redirect(searchParams.callbackUrl ?? "/dashboard");
  }

  return (
    <div
      className={`flex h-screen w-full flex-col items-center justify-center gap-2`}
    >
      <div className="flex h-screen w-full max-w-xl flex-col gap-4 bg-white p-6 shadow-lg min-[36rem]:h-auto min-[36rem]:w-full min-[36rem]:rounded-2xl dark:bg-[#171718]">
        <h1 className="f-display text-2xl font-medium">Sign In</h1>
        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2">
          <form
            action={async (formData) => {
              "use server";
              try {
                await signIn("credentials", formData, {
                  redirectTo: searchParams.callbackUrl ?? "",
                });
              } catch (error) {
                // Signin can fail for a number of reasons, such as the user
                // not existing, or the user not having the correct role.
                // In some cases, you may want to redirect to a custom error
                if (error instanceof AuthError) {
                  return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`);
                }

                // Otherwise if a redirects happens Next.js can handle it
                // so you can just re-thrown the error and let Next.js handle it.
                // Docs:
                // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
                throw error;
              }
            }}
            className="flex w-full flex-col gap-4"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Email
              </label>
              <input
                name="email"
                id="email"
                type="email"
                placeholder="user@example.com"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-[#444444]"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="****"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-[#444444]"
              />
            </div>
            <Button
              color="success"
              variant="contained"
              startIcon={<LoginRoundedIcon />}
              type="submit"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
