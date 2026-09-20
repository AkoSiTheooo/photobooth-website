export type BoothSounds = {
  available: boolean;
  tick: (muted: boolean) => void;
  shutter: (muted: boolean) => void;
};

const FILES = {
  tick: "/sounds/countdown-tick.mp3",
  shutter: "/sounds/shutter.mp3",
};

// The booth is silent until the organizer drops the two files into
// public/sounds. Probing first keeps the mute control from existing when there
// is nothing to mute.
export async function loadBoothSounds(): Promise<BoothSounds> {
  const [tick, shutter] = await Promise.all([probe(FILES.tick), probe(FILES.shutter)]);

  return {
    available: Boolean(tick || shutter),
    tick: (muted) => play(tick, muted),
    shutter: (muted) => play(shutter, muted),
  };
}

async function probe(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) return null;
    const audio = new Audio(url);
    audio.preload = "auto";
    return audio;
  } catch {
    return null;
  }
}

function play(audio: HTMLAudioElement | null, muted: boolean) {
  if (!audio || muted) return;
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // A browser that blocks the sound is not worth interrupting the booth for.
  });
}
