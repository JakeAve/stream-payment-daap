import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Types } from "aptos";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MODULE_ADDRESS = process.env.MODULE_ADDRESS;
const MODULE_NAME = process.env.MODULE_NAME;

export function parseDuration(duration: string): number {
  const [amount, unit] = duration.split(" ");
  const amountNum = parseFloat(amount);
  switch (unit) {
    case "second":
    case "seconds":
      return amountNum;
    case "minute":
    case "minutes":
      return amountNum * 60;
    case "hour":
    case "hours":
      return amountNum * 60 * 60;
    case "day":
    case "days":
      return amountNum * 60 * 60 * 24;
    case "week":
    case "weeks":
      return amountNum * 60 * 60 * 24 * 7;
    case "month":
    case "months":
      return amountNum * 60 * 60 * 24 * 30;
    case "year":
    case "years":
      return amountNum * 60 * 60 * 24 * 365;
    default:
      return 0;
  }
}

export default function StreamCreator(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  const { signAndSubmitTransaction } = useWallet();

  const [address, setAddress] = useState<string>("");
  const [amount, setAmount] = useState("1");
  const [duration, setDuration] = useState<string>("");

  const { toast } = useToast();

  const startStream = async () => {
    if (!address) {
      throw new Error(`Invalid address: ${address}`);
    }
    if (!amount) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    if (!duration) {
      throw new Error(`Invalid duration: ${duration}`);
    }

    if (Number.isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    props.setTxn(true);

    setAddress("");
    setAmount("1");
    setDuration("");

    const payload: Types.TransactionPayload = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_stream`,
      type_arguments: [],
      arguments: [
        address,
        parseFloat(amount) * 100000000,
        parseDuration(duration),
      ],
      type: "public entry fun",
    };

    try {
      const response = await signAndSubmitTransaction(payload);
      toast({
        title: "Stream created!",
        description: `Stream created: to ${`${address.slice(
          0,
          6
        )}...${address.slice(-4)}`} for ${amount} APT`,
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (err) {
      props.setTxn(false);
      return;
    }

    props.setTxn(false);
  };

  return (
    <div className="w-full font-matter">
      <div className="border-b border-neutral-300 pb-3">
        <p className="font-cal text-2xl">Create Payment</p>
      </div>
      <div className="w-full">
        <div className="grid w-full items-center gap-3 my-4">
          <Label htmlFor="address">Recipient address</Label>
          <Input
            type="text"
            id="address"
            placeholder="0x59d870...f469ae14"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="grid w-full items-center gap-3 my-4">
          <Label htmlFor="duration" className="flex flex-row items-center">
            Duration
            <Dialog>
              <DialogTrigger>
                <QuestionMarkCircledIcon className="ml-1.5 inline-block" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>What are the valid units?</DialogTitle>
                  <DialogDescription>
                    The valid units are: &quot;second&quot;, &quot;minute&quot;,
                    &quot;hour&quot;, &quot;day&quot;, &quot;week&quot;,
                    &quot;month&quot;, &quot;year&quot; (with or without
                    &quot;s&quot; at the end).
                    <br />
                    <br />
                    For example, a valid duration is &quot;1 month&quot;,
                    &quot;2 years&quot;, &quot;3.5 days&quot;, etc.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </Label>
          <Input
            type="string"
            id="duration"
            placeholder="3 months"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="amount">Amount (APT)</Label>
          <Input
            type="number"
            id="amount"
            placeholder="Amount of APT"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <div className="pt-6">
        <Button
          className="w-full bg-green-800 hover:bg-green-700 text-white"
          disabled={
            address === "" ||
            parseDuration(duration) < 1 ||
            parseFloat(amount) === 0
          }
          onClick={() => startStream()}
        >
          Start Stream
        </Button>
      </div>
    </div>
  );
}
