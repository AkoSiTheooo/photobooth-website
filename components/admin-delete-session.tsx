"use client";

import { deleteSession } from "@/app/admin/(dashboard)/actions";
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

export function AdminDeleteSession({ sessionId }: { sessionId: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="h-11 rounded-full px-5 font-semibold"
        >
          Delete these photos
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Delete this visit?
          </DialogTitle>
          <DialogDescription className="text-base">
            All four originals are removed from the archive and from storage. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="h-11 rounded-full px-5">
              Keep them
            </Button>
          </DialogClose>
          <form action={deleteSession.bind(null, sessionId)}>
            <Button
              type="submit"
              variant="destructive"
              className="h-11 rounded-full px-5 font-semibold"
            >
              Delete the photos
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
