import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-52 rounded-field" />
      <Skeleton className="mt-3 h-5 w-full max-w-[60ch] rounded-field" />
      <Skeleton className="mt-6 h-11 w-72 rounded-field" />
      <div className="mt-8 flex flex-col gap-3">
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-16 w-full rounded-field" />
        ))}
      </div>
    </div>
  );
}
