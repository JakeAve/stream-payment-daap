"use client";

import {
  Wallet,
  WalletReadyState,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { FaucetClient, Network } from "aptos";
import { ChevronDownIcon } from "@radix-ui/react-icons";

export default function WalletSelector(props: { isTxnInProgress?: boolean }) {
  const { connect, account, connected, disconnect, wallets, isLoading } =
    useWallet();
  const [balance, setBalance] = useState<string | undefined>(undefined);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);

  useEffect(() => {
    if (connected && account) {
      ensureAccountExists().then(() => {
        getBalance(account.address);
      });
    }
  }, [connected, account, props.isTxnInProgress, isFaucetLoading]);

  const ensureAccountExists = async () => {
    if (!account) {
      throw new Error("No account found");
    }
    const response = await fetch(
      `https://fullnode.testnet.aptoslabs.com/v1/accounts/${account.address}`,
      {
        method: "GET",
      }
    );

    const accountData = await response.json();

    if (accountData.error_code == "account_not_found") {
      initializeAccount();
    } else {
      return accountData;
    }
  };

  const initializeAccount = async () => {
    if (!connected || !account || props.isTxnInProgress || isFaucetLoading) {
      return;
    }

    setIsFaucetLoading(true);

    const faucetClient = new FaucetClient(
      Network.TESTNET,
      "https://faucet.testnet.aptoslabs.com"
    );

    try {
      await faucetClient.fundAccount(account.address, 100000000, 1);
    } catch (e) {
      console.warn(e);
    }

    setIsFaucetLoading(false);
  };

  const getBalance = async (address: string) => {
    const body = {
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [address],
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
      setBalance((data / 100000000).toLocaleString());
    } catch (e) {
      setBalance("0");
      return;
    }
  };

  return (
    <div>
      {!connected && !isLoading && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-green-800 hover:bg-green-700 text-white font-matter font-medium px-3 space-x-2">
              <p>Connect Wallet</p>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect your wallet</DialogTitle>
              {wallets.map((w: Wallet, index) => (
                <div
                  key={index}
                  className="flex w-full items-center justify-between rounded-xl p-2"
                >
                  <h2>{w.name}</h2>
                  {w.readyState === WalletReadyState.Installed && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        // w?.connect();
                        connect(w.name);
                      }}
                    >
                      Connect
                    </Button>
                  )}
                  {w.readyState === WalletReadyState.NotDetected && (
                    <a href={w.url} target="_blank">
                      <Button variant="secondary">Install</Button>
                    </a>
                  )}
                </div>
              ))}
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
      {isLoading && (
        <Button variant="secondary" disabled>
          Loading...
        </Button>
      )}
      {connected && account && (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="font-mono" variant="connect">
                {balance}
                {" APT "}
                <span className="font-light">
                  | {account.address.slice(0, 5)}...
                  {account.address.slice(-4)}
                </span>
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  disconnect();
                }}
              >
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
