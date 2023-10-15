import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import CountUp from "react-countup";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Types } from "aptos";
import { convertDataToStreams } from "@/lib/convertDataToStreams";

export type Stream = {
  sender: string;
  recipient: string;
  amountAptFloat: number;
  durationMilliseconds: number;
  startTimestampMilliseconds: number;
  streamId: number;
};

const MODULE_ADDRESS = process.env.MODULE_ADDRESS;
const MODULE_NAME = process.env.MODULE_NAME;

export default function CreatedStreamList(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  const { connected, account, signAndSubmitTransaction } = useWallet();

  const { toast } = useToast();

  const [streams, setStreams] = useState<Stream[]>([]);
  const [areStreamsLoading, setAreStreamsLoading] = useState(true);

  useEffect(() => {
    if (connected) {
      getSenderStreams().then((streams) => {
        setStreams(streams);
        setAreStreamsLoading(false);
      });
    }
  }, [account, connected, props.isTxnInProgress]);

  const cancelStream = async (recipient: string) => {
    if (!account) {
      throw new Error("No account detected");
    }

    props.setTxn(true);

    const payload: Types.TransactionPayload = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::cancel_stream`,
      type_arguments: [],
      arguments: [account.address, recipient],
      type: "public entry fun",
    };

    try {
      const res = await signAndSubmitTransaction(payload);
      toast({
        title: "Stream closed!",
        description: `Closed stream for ${`${recipient.slice(
          0,
          6
        )}...${recipient.slice(-4)}`}`,
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${res.hash}?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (e) {
      props.setTxn(false);
      return;
    }

    props.setTxn(false);
  };

  const getSenderStreams = async () => {
    if (!account) {
      throw new Error("No account detected");
    }

    const body: Types.TransactionPayload = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_senders_streams`,
      type_arguments: [],
      arguments: [account.address],
      type: "public entry fun",
    };

    try {
      const res = await fetch(
        `https://fullnode.testnet.aptoslabs.com/v1/view`,
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!res.ok) {
        throw new Error(`${res.status}, ${res.statusText}`);
      }
      const data = await res.json();
      const { active, completed, pending } = convertDataToStreams(data, {
        sender: account.address,
      });
      return [active, completed, pending].flat();
    } catch (err) {
      console.warn(err);
      return [];
    }
  };

  return (
    <ScrollArea className="rounded-lg bg-neutral-400 border border-neutral-200 w-full">
      <div className="h-fit max-h-96 w-full">
        <Table className="w-full">
          <TableHeader className="bg-neutral-300">
            <TableRow className="uppercase text-xs font-matter hover:bg-neutral-300">
              <TableHead className="text-center">ID</TableHead>
              <TableHead className="text-center">Recipient</TableHead>
              <TableHead className="text-center">End date</TableHead>
              <TableHead className="text-center">Remaining amount</TableHead>
              <TableHead className="text-center">Cancel stream</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areStreamsLoading && (
              <TableRow>
                <TableCell className="items-center">
                  <div className="flex flex-row justify-center items-center w-full">
                    <Skeleton className="h-4 w-4" />
                  </div>
                </TableCell>
                <TableCell className="items-center">
                  <div className="flex flex-row justify-center items-center w-full">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell className="items-center">
                  <div className="flex flex-row justify-center items-center w-full">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell className="items-center">
                  <div className="flex flex-row justify-center items-center w-full">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell className="items-center">
                  <div className="flex flex-row justify-center items-center w-full">
                    <Skeleton className="h-8 w-12" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!areStreamsLoading && streams.length === 0 && (
              <TableRow className="hover:bg-neutral-400">
                <TableCell colSpan={5}>
                  <p className="break-normal text-center font-matter py-4 text-neutral-100">
                    You don&apos;t have any outgoing payments.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {!areStreamsLoading &&
              streams.length > 0 &&
              streams.map((stream, index) => {
                const endDate = new Date(
                  stream.startTimestampMilliseconds +
                    stream.durationMilliseconds
                );
                const amountRemaining = stream.amountAptFloat;
                return (
                  <TableRow
                    key={index}
                    className="font-matter hover:bg-neutral-400"
                  >
                    <TableCell className="text-center">
                      {stream.streamId}
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {`${stream.recipient.slice(
                              0,
                              6
                            )}...${stream.recipient.slice(-4)}`}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{stream.recipient}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      {stream.startTimestampMilliseconds !== 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {endDate.toLocaleDateString()}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{endDate.toLocaleString()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <p>
                          <i>Stream has not started</i>
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-center">
                      {stream.startTimestampMilliseconds > 0 &&
                      new Date() > endDate ? (
                        <p>0.00 APT</p>
                      ) : stream.startTimestampMilliseconds > 0 ? (
                        <CountUp
                          start={amountRemaining}
                          end={0}
                          duration={stream.durationMilliseconds / 1000}
                          decimals={8}
                          decimal="."
                          suffix=" APT"
                          useEasing={false}
                          className="font-mono"
                        />
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {stream.amountAptFloat.toFixed(2)} APT
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{stream.amountAptFloat.toFixed(8)} APT</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        className="bg-red-800 hover:bg-red-700 text-white"
                        onClick={() => {
                          cancelStream(stream.recipient);
                        }}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
