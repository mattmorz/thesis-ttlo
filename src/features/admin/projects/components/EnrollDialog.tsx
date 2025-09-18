import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EnrollDialogProps {
  applicationId: string;
}

export function EnrollDialog({ applicationId }: EnrollDialogProps) {
  const router = useRouter();
  const trpcUtil = trpc.useUtils();
  const { mutateAsync, isPending } = trpc.projects.enrollProject.useMutation();

  function handleEnroll() {
    if (isPending || !applicationId) return;
    const promise = mutateAsync(applicationId);
    toast.promise(promise, {
      loading: "Enrolling...",
      success: () => {
        trpcUtil.projects.get.invalidate();
        router.push(`/admin/projects/${applicationId}`);
        return "Successfully enrolled!";
      },
      error: "Failed to enroll",
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm">
          Enroll <ChevronRight />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Clicking continue will enroll you in the project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleEnroll}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
