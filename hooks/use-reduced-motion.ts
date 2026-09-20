"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function onClient() {
  return window.matchMedia(QUERY).matches;
}

// The server snapshot keeps the first client render identical to the markup.
function onServer() {
  return false;
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, onClient, onServer);
}
