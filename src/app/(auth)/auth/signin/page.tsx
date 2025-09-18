import AUTH_COVER from "@/assets/auth_cover.jpg";
import { ChevronLeft } from "lucide-react";

import { LoginForm } from "@/app/(auth)/auth/_components/login-form";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define cache control for better performance
export const dynamic = "force-dynamic";
export const revalidate = 0; // Don't cache this page

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  // Get the callback URL if it exists
  const callbackUrl = searchParams?.callbackUrl || "/";

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block m-4">
        <Image
          src={AUTH_COVER}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover rounded-lg"
          priority
        />
        <div className="absolute inset-0 bg-black/40 rounded-lg flex flex-col items-center justify-center text-white p-10">
          <h1 className="text-3xl font-bold mb-4">CSU TTLO Portal</h1>
          <p className="text-lg max-w-md text-center">
            Sign in to access the Caraga State University Technology Transfer
            and Licensing Office portal.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <Button variant="link" asChild>
            <Link href="/">
              <ChevronLeft /> Back to Home
            </Link>
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <h2 className="text-2xl font-bold mb-6 lg:hidden text-center">
              CSU TTLO Portal
            </h2>
            <LoginForm callbackUrl={callbackUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
