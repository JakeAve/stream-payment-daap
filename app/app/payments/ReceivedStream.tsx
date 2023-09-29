import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { CopyIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Types } from "aptos";

const MODULE_ADDRESS = process.env.MODULE_ADDRESS;
const MODULE_NAME = process.env.MODULE_NAME;

export function parseDurationShort(durationMilliseconds: number): string {
  let durationSeconds = durationMilliseconds / 1000;
  let durationMinutes = durationSeconds / 60;
  let durationHours = durationMinutes / 60;
  let durationDays = durationHours / 24;
  let durationWeeks = durationDays / 7;
  let durationMonths = durationWeeks / 4;
  let durationYears = durationMonths / 12;

  if (durationYears >= 1) {
    return `${durationYears.toFixed(2)} years`;
  } else if (durationDays >= 1) {
    return `${durationDays.toFixed(2)} days`;
  } else if (durationHours >= 1) {
    return `${durationHours.toFixed(2)} hours`;
  } else if (durationMinutes >= 1) {
    return `${durationMinutes.toFixed(2)} minutes`;
  } else {
    return `${durationSeconds.toFixed(2)} seconds`;
  }
}

type Event = {
  type:
    | "stream_created"
    | "stream_accepted"
    | "stream_claimed"
    | "stream_cancelled"
    | "unknown";
  timestamp: number;
  data: {
    amount?: number;
    amount_to_sender?: number;
    amount_to_recipient?: number;
  };
};

export default function ReceivedStream(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
  senderAddress: string;
  startTimestampSeconds: number;
  durationSeconds: number;
  amountAptFloat: number;
  streamId: number;
}) {
  // wallet state
  const { account, signAndSubmitTransaction } = useWallet();
  // toast state
  const { toast } = useToast();

  // time state for the progress bar
  const [timeNow, setTimeNow] = useState(Date.now());
  // event state for the history
  const [events, setEvents] = useState<Event[]>([]);

  const isStreamStarted = props.startTimestampSeconds > 0;
  const isStreamDurationCompleted =
    (props.startTimestampSeconds + props.durationSeconds) * 1000 < timeNow;

  /* 
    Refreshes the progress bar every second
  */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* 
    calculates the amount of APT to claim based on the time elapsed
  */
  const getAmountToClaim = () => {
    let timeElapsedSeconds = timeNow / 1000 - props.startTimestampSeconds;
    let timeElapsedFraction = timeElapsedSeconds / props.durationSeconds;
    let amountToClaim = props.amountAptFloat * timeElapsedFraction;
    console.log("amountToClaim", amountToClaim);
    return amountToClaim;
  };

  /* 
    Claim APT from the stream
  */
  const claimApt = async () => {
    /* 
      TODO: Set the isTxnInProgress prop to true
    */
    props.setTxn(true);
    /* 
      TODO: Create the payload for the claim_stream transaction
    */
    const payload: Types.TransactionPayload = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::claim_stream`,
      type_arguments: [],
      arguments: [props.senderAddress],
      type: "public entry fun",
    };
    /* 
      TODO: In a try/catch block, sign and submit the transaction using the signAndSubmitTransaction
            function provided by the wallet adapter. Use the payload created above.
      
      HINT: 
        - In case of an error, set the isTxnInProgress prop to false and return.
        - In case of success, show a toast notification with a link to the transaction on the explorer.

      -- toast -- 
      */
    try {
      const res = await signAndSubmitTransaction(payload);
      console.log("claim_stream", res);
      toast({
        title: "APT claimed!",
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${res.hash}?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (err) {
      console.error(err);
      props.setTxn(false);
    }

    /* 
      TODO: Set the isTxnInProgress prop to false
    */
    props.setTxn(false);
  };

  /* 
    Accept the stream
  */
  const acceptStream = async () => {
    /* 
      TODO: Set the isTxnInProgress prop to true
    */
    props.setTxn(true);
    /* 
      TODO: Create the payload for the accept_stream transaction
    */
    const payload: Types.TransactionPayload = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::accept_stream`,
      type_arguments: [],
      arguments: [props.senderAddress],
      type: "public entry fun",
    };
    /* 
      TODO: In a try/catch block, sign and submit the transaction using the signAndSubmitTransaction
            function provided by the wallet adapter. Use the payload created above.
      
      HINT: 
        - In case of an error, set the isTxnInProgress prop to false and return.
        - In case of success, show a toast notification with a link to the transaction on the explorer.

      -- toast --
      */

    try {
      const res = await signAndSubmitTransaction(payload);
      console.log("accept_stream", res);

      toast({
        title: "Stream accepted!",
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${res.hash}?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (err) {
      console.error(err);
      props.setTxn(false);
    }
    /* 
      TODO: Set the isTxnInProgress prop to false
    */

    props.setTxn(false);
  };

  /* 
    Reject the stream
  */
  const rejectStream = async () => {
    /* 
      TODO: Return if the account is not defined
    */
    if (!account) {
      throw new Error("No account detected");
    }
    /* 
      TODO: Set the isTxnInProgress prop to true
    */
    props.setTxn(true);
    /* 
      TODO: Create the payload for the cancel_stream transaction
    */
    const payload: Types.TransactionPayload = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::cancel_stream`,
      type_arguments: [],
      arguments: [props.senderAddress, account.address],
      type: "public entry fun",
    };
    /* 
      TODO: In a try/catch block, sign and submit the transaction using the signAndSubmitTransaction
            function provided by the wallet adapter. Use the payload created above.
      
      HINT: 
        - In case of an error, set the isTxnInProgress prop to false and return.
        - In case of success, show a toast notification with a link to the transaction on the explorer.

      -- toast --
      */
    try {
      const res = await signAndSubmitTransaction(payload);
      console.log("cancel_stream", res);
      toast({
        title: "Stream rejected",
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${res.hash}?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (err) {
      console.error(err);
      props.setTxn(false);
    }
    /* 
      TODO: Set the isTxnInProgress prop to false
    */
    props.setTxn(false);
  };

  /* 
    Fetches the event list from the event store
  */
  interface EventEntry {
    type: string;
    data: {
      amount?: string;
      receiver_address: string;
      sender_address: string;
      stream_id: string;
      timestamp: string;
      amount_to_receiver?: string;
      amount_to_sender?: string;
    };
  }
  const getEventList = async (
    event_store_name: string
  ): Promise<EventEntry[]> => {
    /* 
      TODO: Fetch the event of the event_store_name from the event store and return the result in 
            a promise. 
    */
    try {
      const response = await fetch(
        `https://fullnode.testnet.aptoslabs.com/v1/accounts/${process.env.RESOURCE_ACCOUNT_ADDRESS}/events/${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::ModuleEventStore/${event_store_name}_events?limit=10000`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(`${response.status}, ${response.statusText}`);
      }
      return response.json();
    } catch {
      console.warn(`No logs found for this entry ${event_store_name}`);
      return [];
    }
  };

  /* 
    Retrieves the stream events from the event store and sets the events state
  */
  const getStreamEvents = async () => {
    /* 
      TODO: Use the getEventList function to fetch all the events from the event store. 
    */
    const eventFetches = [
      "stream_create",
      "stream_accept",
      "stream_claim",
      "stream_close",
    ].map((e) => getEventList(e));
    const eventsData = (await Promise.all(eventFetches)).flat();
    /* 
      TODO: Set the events state with events for the specific stream only. Parse the event data to match the 
            Event type above. 

      HINT: 
        - Use the streamId prop to filter the events
        - Use the event.type to determine the type of the event to properly parse the event data
        - Remember to convert units when necessary
    */
    // console.log("all-events", eventsData);
    const filtered = eventsData
      .filter((e) => {
        return parseInt(e.data.stream_id) === props.streamId;
      })
      .map((e): Event => {
        let type = "unknown";
        if (e.type.includes("StreamCreateEvent")) {
          type = "stream_created";
        } else if (e.type.includes("StreamAcceptEvent")) {
          type = "stream_accepted";
        } else if (e.type.includes("StreamClaimEvent")) {
          type = "stream_claimed";
        } else if (e.type.includes("StreamCloseEvent")) {
          type = "stream_cancelled";
        }

        const event = {
          type,
          timestamp: Number(e.data.timestamp),
          data: {},
        } as Event;

        if (e.data.amount) {
          event.data.amount = parseFloat(e.data.amount) / 100000000;
        }
        if (e.data.amount_to_receiver) {
          event.data.amount_to_recipient =
            parseFloat(e.data.amount_to_receiver) / 100000000;
        }
        if (e.data.amount_to_sender) {
          event.data.amount_to_sender = parseFloat(e.data.amount_to_sender);
        }

        return event;
      });
    console.log("filtered events", filtered);
    setEvents(filtered);
  };

  return (
    <Card className="relative bg-neutral-300 border border-neutral-200 rounded-lg">
      <CardContent className="flex flex-col justify-between">
        <div className="w-full flex flex-col border-b border-neutral-200 p-4 space-y-3">
          <div className="flex flex-row items-center font-matter text-2xl space-x-3">
            <Image
              src="/aptos-icon.svg"
              alt="Aptos Logo"
              width={22}
              height={22}
            />
            {
              /* 
                TODO: Display the different amount based on the stream status

                HINT: 
                  - Use the getAmountToClaim function and the amountAptFloat prop to determine if the
                    stream is completed
                  - Use the startTimestampSeconds prop to determine if the stream is accepted yet
                  - if the stream is not accepted yet, display the static total amount 
                  - if the stream is completed, display the static total amount
                  - if the stream is active (accepted, but not completed), display the count up 
                    animation
              
                -- count up animation --
                // jake come back and look at this
                */
              props.startTimestampSeconds === 0 ||
              getAmountToClaim() > 0 ? (
                <p>{props.amountAptFloat}</p>
              ) : (
                <CountUp
                  start={getAmountToClaim()}
                  end={props.amountAptFloat}
                  duration={props.durationSeconds}
                  separator=","
                  decimals={8}
                  decimal="."
                  prefix=""
                  suffix=""
                  useEasing={false}
                />
              )
            }

            {
              /* 
                TODO: Show the reject button only if the stream is not completed 

                HINT: 
                - Use the getAmountToClaim function and the amountAptFloat prop to determine if the 
                  stream is completed

                -- reject button --
                */
              getAmountToClaim() < props.amountAptFloat && (
                <div className="w-full flex items-center justify-end absolute top-4 right-4">
                  <div className="bg-neutral-200 text-neutral-100 p-1.5 rounded-md hover:text-red-400 hover:cursor-pointer hover:bg-neutral-100 hover:bg-opacity-25">
                    <p onClick={rejectStream}>
                      <Cross2Icon />
                    </p>
                  </div>
                </div>
              )
            }
          </div>

          {/* TODO: Show the progress bar based on the stream status

              HINT: 
                - if the stream is not accepted yet, show a progress bar with 0 value
                - if the stream is completed, show a progress bar with 100 value
                - if the stream is active (accepted, but not completed), show a progress bar with the 
                  percentage of the amount claimed */}

          {props.startTimestampSeconds === 0 ? (
            <Progress value={0} max={100} className="w-full" />
          ) : isStreamDurationCompleted ? (
            <Progress value={100} max={100} className="w-full" />
          ) : (
            <Progress
              value={(getAmountToClaim() / props.amountAptFloat) * 100}
              max={100}
              className="w-full bg-green-500 h-3 rounded"
            />
          )}

          <div className="flex flex-row items-center justify-between w-full">
            <Dialog>
              <DialogTrigger>
                <p
                  className="text-blue-400 hover:underline text-xs"
                  onClick={getStreamEvents}
                >
                  View History
                </p>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="border-b border-neutral-300 pb-4">
                  <DialogTitle>Payment History</DialogTitle>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Action</TableHead>
                      <TableHead className="text-center">Time</TableHead>
                      <TableHead className="text-center">
                        Additional info
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {
                      /* 
                        TODO: Show a skeleton row if the events array is empty

                        HINT: 
                          - Use the events array to determine if the events are empty

                        -- skeleton row --*/
                      !events.length && (
                        <TableRow>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-28" />
                            </div>
                          </TableCell>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </TableCell>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }
                    {
                      /* 
                        TODO: Display each event in the events array with the following format:
                      
                        -- table row -- 
                        */
                      events.map((event) => (
                        <TableRow key={event.timestamp}>
                          <TableCell className="text-center">
                            {event.type === "stream_created" ? (
                              <span className="font-mono">Stream created</span>
                            ) : event.type === "stream_accepted" ? (
                              <span className="font-mono">Stream accepted</span>
                            ) : event.type === "stream_claimed" ? (
                              <span className="font-mono">APT claimed</span>
                            ) : event.type === "stream_cancelled" ? (
                              <span className="font-mono">Stream canceled</span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-center">
                            {new Date(event.timestamp * 1000).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            {event.type === "stream_created" ? (
                              <span className="font-mono">
                                {event.data.amount} APT streaming
                              </span>
                            ) : event.type === "stream_accepted" ? (
                              <span className="font-mono">
                                {event.data.amount} APT streaming
                              </span>
                            ) : event.type === "stream_claimed" ? (
                              <span className="font-mono">
                                {event.data.amount} APT claimed
                              </span>
                            ) : event.type === "stream_cancelled" ? (
                              <span className="font-mono">
                                {event.data.amount_to_recipient} APT claimed and{" "}
                                {event.data.amount_to_sender} refunded to sender
                              </span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>

            <div className="flex flex-row items-center justify-end space-x-2 font-matter">
              <p className="text-sm text-neutral-100">Total:</p>
              <p className="text-lg">{props.amountAptFloat} APT</p>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-3 p-4 border-b border-neutral-200">
          <div className="w-full flex flex-row gap-3 items-center justify-between">
            <p className="text-neutral-100 text-sm">From:</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className="font-matter bg-neutral-200 text-white hover:bg-neutral-100 space-x-2 text-xs px-3 flex flex-row items-center py-2 rounded hover:bg-opacity-25"
                    onClick={() => {
                      /*
                        TODO: Copy the sender address to the clipboard and show a toast notification
                        with a link to the sender account on the explorer

                        -- toast --
                        */
                      navigator.clipboard
                        .writeText(props.senderAddress)
                        .catch(() => {});
                      toast({
                        description: "Address copied to clipboard",
                        action: (
                          <a
                            href={`https://explorer.aptoslabs.com/account/${props.senderAddress}?network=testnet`}
                            target="_blank"
                          >
                            <ToastAction altText="View account on explorer">
                              View on explorer
                            </ToastAction>
                          </a>
                        ),
                      });
                    }}
                  >
                    <p className="">
                      {`${props.senderAddress.slice(
                        0,
                        6
                      )}...${props.senderAddress.slice(-4)}`}
                    </p>
                    <CopyIcon />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-full">
                  <p>{props.senderAddress}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {
            /* 
              TODO: Display the end time if the stream has been accepted

              -- end time --
              */
            isStreamStarted && (
              <div className="w-full flex flex-row gap-3 items-center justify-between">
                <p className="text-neutral-100 text-sm">End:</p>
                <p className="text-end text-sm">
                  {new Date(
                    (props.startTimestampSeconds + props.durationSeconds) * 1000
                  ).toLocaleString()}
                </p>
              </div>
            )
          }
          {
            /* 
              TODO: Display the duration if the stream has not been accepted yet

              -- duration --
              */
            props.startTimestampSeconds === 0 && (
              <div className="w-full flex flex-row items-center justify-between">
                <p className="text-neutral-100 text-sm">Duration:</p>
                <span className="font-matter">
                  {parseDurationShort(props.durationSeconds * 1000)}
                </span>
              </div>
            )
          }
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex flex-row justify-between w-full gap-4 p-4">
          {/* Display the claim button if the stream is active (accepted, but not completed) */}
          {isStreamStarted ? (
            <Button
              className="grow bg-green-800 hover:bg-green-700 text-white"
              onClick={() => {
                claimApt();
              }}
            >
              Claim
            </Button>
          ) : (
            // Display the accept button if the stream is not accepted yet
            <Button
              className="grow bg-green-800 hover:bg-green-700 text-white"
              onClick={() => {
                acceptStream();
              }}
            >
              Accept
            </Button>
          )}

          {/* These instructions make no sense. Probably means don't display the reject button if the stream is completed (accepted and finished) */}
          {/* **DON'T** Display the reject button if the stream is completed (accepted and finished) */}
          {isStreamDurationCompleted && (
            <Button
              className="grow bg-red-800 hover:bg-red-700 text-white font-matter"
              onClick={() => {
                rejectStream();
              }}
            >
              Reject
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
