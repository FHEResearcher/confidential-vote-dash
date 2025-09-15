import { useAccount } from 'wagmi';
import { WalletConnect } from "@/components/WalletConnect";
import { VotingDashboard } from "@/components/VotingDashboard";

const Index = () => {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return <WalletConnect onConnect={() => {}} />;
  }

  return (
    <VotingDashboard 
      walletAddress={address} 
      onDisconnect={() => {}} 
    />
  );
};

export default Index;