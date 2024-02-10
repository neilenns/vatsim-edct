import { useEffect, useState } from "react";
import { useAppContext } from "../hooks/useAppContext.mts";

export interface useAudioType {
  play: () => Promise<void>;
}

export function useAudio(url: string): useAudioType {
  const [audio] = useState(new Audio(url));
  const [isMuted, setIsMuted] = useState(false);
  const { muted } = useAppContext();

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  const play = async () => {
    if (!isMuted) {
      try {
        await audio.play();
      } catch {
        console.log(
          `Playing audio blocked by the browser. Interact with the page or install it as an app.`
        );
      }
    }
  };

  return { play };
}
