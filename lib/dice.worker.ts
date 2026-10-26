import { calculateDiceStats, type DiceRoll } from "nimble-dice";

self.onmessage = ({ data }: MessageEvent<DiceRoll>) => {
  self.postMessage(calculateDiceStats(data));
};
