import { useState } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { VotingDashboard } from "@/components/VotingDashboard";

const Index = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
  };

  if (!walletAddress) {
    return <WalletConnect onConnect={handleWalletConnect} />;
  }

  return (
    <VotingDashboard 
      walletAddress={walletAddress} 
      onDisconnect={handleWalletDisconnect} 
    />
  );
};

export default Index;