import { useCallback, useEffect, useRef } from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { sounds } from "@/constants";

export function useDiceGameAudio() {
  const rollRef = useRef<AudioPlayer | null>(null);
  const winRef = useRef<AudioPlayer | null>(null);
  const loseRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });

    const roll = createAudioPlayer(sounds.rollDice);
    roll.loop = true;
    roll.volume = 0.7;

    const win = createAudioPlayer(sounds.winDice);
    win.volume = 1;

    const lose = createAudioPlayer(sounds.rollDice);
    lose.volume = 1;

    rollRef.current = roll;
    winRef.current = win;
    loseRef.current = lose;

    return () => {
      roll.remove();
      win.remove();
      lose.remove();
      rollRef.current = null;
      winRef.current = null;
      loseRef.current = null;
    };
  }, []);

  const playSound = useCallback(async (type: "roll" | "win" | "lose") => {
    try {
      const player =
        type === "roll" ? rollRef.current : type === "win" ? winRef.current : loseRef.current;
      if (!player) return;
      await player.seekTo(0);
      player.play();
    } catch {
      // ignore
    }
  }, []);

  const stopRollSound = useCallback(async () => {
    try {
      const player = rollRef.current;
      if (!player) return;
      player.pause();
      await player.seekTo(0);
    } catch {
      // ignore
    }
  }, []);

  return { playSound, stopRollSound };
}
