import { useCallback, useEffect, useRef } from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from "expo-audio";
import { sounds } from "@/constants";

type SfxKey = "flip" | "win" | "lose" | "next" | "error";

const SFX_SOURCES: Record<SfxKey, AudioSource> = {
  flip: sounds.flipPlayer,
  win: sounds.winPlayer,
  lose: sounds.losePlayer,
  next: sounds.startPlayer,
  error: sounds.errorPlayer,
};

export const useSfx = () => {
  const players = useRef<Partial<Record<SfxKey, AudioPlayer>>>({});

  useEffect(() => {
    let mounted = true;

    void setAudioModeAsync({ playsInSilentMode: true });

    for (const [key, source] of Object.entries(SFX_SOURCES) as [SfxKey, AudioSource][]) {
      if (!mounted) return;
      const player = createAudioPlayer(source, { updateInterval: 500 });
      player.volume = 1;
      players.current[key] = player;
    }

    return () => {
      mounted = false;
      Object.values(players.current).forEach((player) => player?.remove());
      players.current = {};
    };
  }, []);

  const play = useCallback(async (key: SfxKey) => {
    try {
      const player = players.current[key];
      if (!player) return;
      await player.seekTo(0);
      player.play();
    } catch {
      // ignore playback errors during rapid game actions
    }
  }, []);

  return {
    flip: () => void play("flip"),
    win: () => void play("win"),
    lose: () => void play("lose"),
    next: () => void play("next"),
    error: () => void play("error"),
  };
};
