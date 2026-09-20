"use client";

import { useSyncExternalStore } from "react";

// dateStyle and timeStyle cannot be combined with timeZoneName: it throws
// "Invalid option : option". Explicit components keep the zone label working.
const UTC_FORMAT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const LOCAL_FORMAT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

function subscribe() {
  return () => {};
}

// Server and first client render use UTC, then the browser reports its own zone.
// Reading the zone as an external store avoids a cascading render in an effect.
export function LocalTime({ iso }: { iso: string }) {
  const label = useSyncExternalStore(
    subscribe,
    () => LOCAL_FORMAT.format(new Date(iso)),
    () => UTC_FORMAT.format(new Date(iso)),
  );

  return <time dateTime={iso}>{label}</time>;
}
