import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Shield, Vote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export const WalletConnect = ({ onConnect }: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate wallet connection
    setTimeout(() => {
      const mockAddress = "0x" + Math.random().toString(16).substr(2, 40);
      onConnect(mockAddress);
      toast({
        title: "Wallet Connected",
        description: "You're now ready to participate in judging.",
      });
      setIsConnecting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-secondary p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border/20 shadow-glow-primary">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Judging Made Confidential
            </h1>
            <p className="text-muted-foreground">
              Connect your wallet to access the secure voting dashboard
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <Wallet className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Secure</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto text-encrypted mb-1" />
              <p className="text-xs text-muted-foreground">Encrypted</p>
            </div>
            <div className="text-center">
              <Vote className="w-6 h-6 mx-auto text-success mb-1" />
              <p className="text-xs text-muted-foreground">Anonymous</p>
            </div>
          </div>

          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Your votes are encrypted and anonymous until the reveal phase
          </p>
        </CardContent>
      </Card>
    </div>
  );
};