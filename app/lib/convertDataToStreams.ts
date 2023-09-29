import { Stream } from "@/app/payments/CreatedStreamList";

interface RecipientOnly {
    recipient: string;
  }
  
  interface SenderOnly {
    sender: string;
  }
  
  type RecipientSender = RecipientOnly | SenderOnly;

export function convertDataToStreams(data: any, recipientSender: RecipientSender) {
    const recipientArg = (recipientSender as RecipientOnly).recipient 
    const senderArg = (recipientSender as SenderOnly).sender 
    const now = Date.now();
    const pending: Stream[] = [];
    const active: Stream[] = [];
    const completed: Stream[] = [];

    for (let i = 0; i < data[0].length; i++) {
      const sender = senderArg || data[0][i];
      const recipient = recipientArg || data[0][i];
      const startTimestampMilliseconds = data[1][i] * 1000;
      const durationMilliseconds = parseInt(data[2][i]);
      const amountAptFloat = parseFloat(data[3][i]) / 100000000;
      const streamId = parseInt(data[4][i]);

      const stream: Stream = {
        sender,
        streamId,
        durationMilliseconds,
        startTimestampMilliseconds,
        amountAptFloat,
        recipient
      };

      if (startTimestampMilliseconds === 0) {
        pending.push(stream);
      } else if (startTimestampMilliseconds + durationMilliseconds <= now) {
        completed.push(stream);
      } else {
        active.push(stream);
      }
    }

    return {
      pending,
      completed,
      active,
    };
}