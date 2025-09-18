import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signIn } from "@/auth";
import { memo } from "react";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  callbackUrl?: string;
}

// Memoize the component to prevent unnecessary re-renders
// that might trigger additional session checks
function LoginFormComponent({
  className,
  callbackUrl = "/",
  ...props
}: LoginFormProps) {
  return (
    <form
      className={cn("flex flex-col gap-6 space-y-6", className)}
      {...props}
      action={async () => {
        "use server";
        // Use a short-term cookie to prevent multiple sign-in attempts
        // This helps reduce duplicate session checks
        await signIn("google", {
          callbackUrl,
          // Allow redirects so we don't trigger duplicate session checks
          redirect: true,
        });
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground text-sm">
          Sign in with your Google account to continue
        </p>
      </div>
      <Button variant="outline" size="lg" className="w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={20}
          height={20}
          viewBox="0 0 256 262"
          className="mr-2"
        >
          <path
            fill="#4285f4"
            d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
          ></path>
          <path
            fill="#34a853"
            d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
          ></path>
          <path
            fill="#fbbc05"
            d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
          ></path>
          <path
            fill="#eb4335"
            d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
          ></path>
        </svg>
        Continue with Google
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        By continuing, you agree to our
        <Link href="#" className="mx-1 text-black/80">
          Terms of Service
        </Link>
        and
        <Link href="#" className="mx-1 text-black/80">
          Privacy Policy
        </Link>
      </div>
    </form>
  );
}

// Export a memoized version to prevent unnecessary re-renders
export const LoginForm = memo(LoginFormComponent);
