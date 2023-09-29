import { Stream } from "@/app/payments/CreatedStreamList";

export function addStreamRatesPerSecond(streams: Stream[]): number {
  return streams.reduce((rate, { amountAptFloat, durationMilliseconds }) => {
    return rate + amountAptFloat / (durationMilliseconds / 1000);
  }, 0);
}
