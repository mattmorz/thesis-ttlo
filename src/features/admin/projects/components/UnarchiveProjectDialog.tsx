"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

const formSchema = z.object({
  reason: z.string().min(1).min(1),
});

interface Props {
  projectId: string;
}

export function UnarchiveProjectDialog({ projectId }: Props) {
  const router = useRouter();
  const archiveMutation = trpc.archives.delete.useMutation();

  function onSubmit() {
    if (!projectId) return;

    const promise = archiveMutation.mutateAsync({
      applicationId: projectId,
    });

    toast.promise(promise, {
      loading: "Unarchiving...",
      success: () => {
        router.replace("/admin/archives");
        return "Successfully Unarchived!";
      },
      error: "Failed to Unarchive",
    });
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={archiveMutation.isPending || archiveMutation.isSuccess}
        >
          <Archive />
          Unarchive Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unarchive Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to unarchive the project?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter></DialogFooter>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={() => onSubmit()} className="flex-1">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
