"use client";

import { Button } from "@/components/ui/button";
import { ChevronDownIcon, LinkBreak2Icon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import ReceivedStream from "./ReceivedStream";
import CreatedStreamList, { Stream } from "./CreatedStreamList";
import { NetworkName, useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReceivedStreamSkeleton from "./ReceivedStreamSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarLoader } from "react-spinners";
import { NoWalletConnected } from "@/components/NoWalletConnected";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import StreamCreator from "./StreamCreator";
import { convertDataToStreams } from "@/lib/convertDataToStreams";

const MODULE_ADDRESS = process.env.MODULE_ADDRESS;
const MODULE_NAME = process.env.MODULE_NAME;

enum Sort {
  MostRecent = "Most Recent",
  Oldest = "Oldest",
  EndDateCloseToFar = "End Date - Close to Far",
  EndDateFarToClose = "End Date - Far to Close",
  TotalAmountLowToHigh = "Total Amount - Low to High",
  TotalAmountHightToLow = "Total Amount - High to Low",
  ClaimableAmountHighToClose = "Claimable Amount - High to Low",
  ClaimableAmountCloseToHigh = "Claimable Amount - Low to High",
}
function stringToSortEnum(value: string): Sort | null {
  if (Object.values(Sort).indexOf(value as Sort) >= 0) {
    return value as Sort;
  }
  return null;
}

enum Status {
  Active = "Active",
  Completed = "Completed",
}
function stringToStatusEnum(value: string): Status | null {
  if (Object.values(Status).indexOf(value as Status) >= 0) {
    return value as Status;
  }
  return null;
}

export default function ClaimerPage() {
  const { isLoading, connected, account, network } = useWallet();
  const [streams, setStreams] = useState<{
    Completed: Stream[];
    Active: Stream[];
  }>({ Completed: [], Active: [] });

  const [txnInProgress, setTxnInProgress] = useState(false);
  const [areStreamsLoading, setAreStreamsLoading] = useState(true);

  const [sort, setSort] = useState(Sort.MostRecent);
  const [status, setStatus] = useState(Status.Active);

  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);

  useEffect(() => {
    if (txnInProgress) setIsCreatePaymentOpen(false);
  }, [isCreatePaymentOpen, txnInProgress]);

  useEffect(() => {
    if (connected && !txnInProgress) {
      getReceiverStreams().then((streams) => {
        setStreams({
          Active: [...streams.Pending, ...streams.Active],
          Completed: streams.Completed,
        });
        setAreStreamsLoading(false);
      });
    }
  }, [account, connected, txnInProgress]);

  const getReceiverStreams = async () => {
    if (!account) {
      throw new Error("No account");
    }

    setAreStreamsLoading(true);

    const body = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_receivers_streams`,
      type_arguments: [],
      arguments: [account.address],
    };

    const resp = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/view`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    if (!resp.ok) {
      throw new Error(`${resp.status}, ${resp.statusText}`);
    }
    const data = await resp.json();
    const { pending, active, completed } = convertDataToStreams(data, {
      recipient: account.address,
    });

    return {
      Pending: pending,
      Completed: completed,
      Active: active,
    };
  };

  if (!connected) {
    return <NoWalletConnected />;
  }

  return (
    <>
      {txnInProgress && (
        <div className="bg-neutral-900/50 backdrop-blur absolute top-0 bottom-0 left-0 right-0 z-50 m-auto flex items-center justify-center">
          <div className="p-6 flex flex-col items-center justify-center space-y-4">
            <BarLoader color="#10B981" />
            <p className="text-lg font-medium">Processing Transaction</p>
          </div>
        </div>
      )}

      <>
        {connected &&
          !isLoading &&
          network?.name.toLocaleLowerCase() !==
            NetworkName.Testnet.toLocaleLowerCase() && (
            <Alert variant="destructive" className="w-fit mb-2 mr-2">
              <LinkBreak2Icon className="h-4 w-4" />
              <AlertTitle>Switch your network!</AlertTitle>
              <AlertDescription>
                You need to switch your network to Testnet before you can use
                this app.
              </AlertDescription>
            </Alert>
          )}

        {!isLoading &&
          connected &&
          network &&
          network.name.toString() == "Testnet" && (
            <div className="w-full flex items-center justify-center py-5 px-6">
              <div className="flex flex-col items-start justify-start grow gap-4 w-full max-w-6xl">
                <div className="flex flex-col space-y-3 border-b border-neutral-300 w-full pb-5">
                  <div className="flex flex-row items-end justify-between w-full">
                    <p className="text-4xl font-bold font-cal">
                      Outgoing Payments
                    </p>

                    <Dialog
                      open={isCreatePaymentOpen}
                      onOpenChange={setIsCreatePaymentOpen}
                    >
                      <DialogTrigger>
                        <Button className="bg-green-800 text-white font-matter px-3 hover:bg-green-700">
                          Create Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <StreamCreator
                          setTxn={setTxnInProgress}
                          isTxnInProgress={txnInProgress}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="w-full">
                  <CreatedStreamList
                    setTxn={setTxnInProgress}
                    isTxnInProgress={txnInProgress}
                  />
                </div>

                <div className="flex flex-col space-y-3 border-b border-neutral-300 w-full pb-5">
                  <div className="flex flex-row items-end justify-between w-full">
                    <p className="text-4xl font-bold font-cal">
                      Incoming Payments
                    </p>

                    <div className="flex flex-row gap-3 items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-neutral-300 text-white hover:bg-neutral-200">
                            {status} streams{" "}
                            <ChevronDownIcon className="ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Stream status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup
                            value={status}
                            onValueChange={(value) => {
                              setStatus(
                                stringToStatusEnum(value) || Status.Active
                              );
                            }}
                          >
                            <DropdownMenuRadioItem value={Status.Active}>
                              {Status.Active} streams - {streams.Active.length}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value={Status.Completed}>
                              {Status.Completed} streams -{" "}
                              {streams.Completed.length}
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-neutral-300 text-white hover:bg-neutral-200">
                            {sort} <ChevronDownIcon className="ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Sorting methods</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup
                            value={sort}
                            onValueChange={(value) => {
                              setSort(
                                stringToSortEnum(value) || Sort.MostRecent
                              );
                            }}
                          >
                            <DropdownMenuRadioItem value={Sort.MostRecent}>
                              {Sort.MostRecent}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value={Sort.Oldest}>
                              {Sort.Oldest}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.ClaimableAmountHighToClose}
                            >
                              {Sort.ClaimableAmountHighToClose}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.ClaimableAmountCloseToHigh}
                            >
                              {Sort.ClaimableAmountCloseToHigh}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.TotalAmountHightToLow}
                            >
                              {Sort.TotalAmountHightToLow}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.TotalAmountLowToHigh}
                            >
                              {Sort.TotalAmountLowToHigh}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.EndDateFarToClose}
                            >
                              {Sort.EndDateFarToClose}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.EndDateCloseToFar}
                            >
                              {Sort.EndDateCloseToFar}
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col items-center gap-4">
                  {(isLoading || areStreamsLoading) && (
                    <div className="grid grid-cols-1 gap-5 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                    </div>
                  )}

                  {!streams[status].length &&
                    !isLoading &&
                    !areStreamsLoading && (
                      <div className="flex flex-col space-y-1 items-center justify-center w-full bg-neutral-400 border border-neutral-300 py-12 px-6 font-matter rounded-lg">
                        <p className="text-2xl font-medium">
                          No Incoming Payments
                        </p>
                        <p className="text-neutral-100 text-lg">
                          You do not have any {status.toLowerCase()} payments.
                        </p>
                      </div>
                    )}

                  {!isLoading && !areStreamsLoading && (
                    <div className="grid grid-cols-1 gap-5 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
                      {streams[status]
                        .map((stream) => {
                          return (
                            <ReceivedStream
                              key={stream.streamId}
                              isTxnInProgress={txnInProgress}
                              setTxn={setTxnInProgress}
                              senderAddress={stream.sender}
                              amountAptFloat={stream.amountAptFloat}
                              durationSeconds={
                                stream.durationMilliseconds / 1000
                              }
                              startTimestampSeconds={
                                stream.startTimestampMilliseconds / 1000
                              }
                              streamId={stream.streamId}
                            />
                          );
                        })
                        .sort((a, b) => {
                          switch (sort) {
                            case Sort.MostRecent:
                              return b.props.streamId - a.props.streamId;
                            case Sort.Oldest:
                              return a.props.streamId - b.props.streamId;
                            case Sort.TotalAmountHightToLow:
                              return b.props.totalAmount - a.props.totalAmount;
                            case Sort.TotalAmountLowToHigh:
                              return a.props.totalAmount - b.props.totalAmount;
                            case Sort.EndDateFarToClose:
                              return b.props.endDate - a.props.endDate;
                            case Sort.EndDateCloseToFar:
                              return a.props.endDate - b.props.endDate;
                            case Sort.ClaimableAmountHighToClose:
                              return (
                                b.props.claimableAmount -
                                a.props.claimableAmount
                              );
                            case Sort.ClaimableAmountCloseToHigh:
                              return (
                                a.props.claimableAmount -
                                b.props.claimableAmount
                              );
                            default:
                              return b.props.streamId - a.props.streamId;
                          }
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </>
    </>
  );
}
