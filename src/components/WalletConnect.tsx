import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Shield, Vote } from "lucide-react";

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export const WalletConnect = ({ onConnect }: WalletConnectProps) => {

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

          <div className="w-full">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="w-full bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-primary-foreground font-medium py-3 px-4 rounded-lg flex items-center justify-center"
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="w-full bg-red-500 hover:bg-red-600 transition-all duration-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="flex items-center space-x-2 bg-muted hover:bg-muted/80 transition-all duration-300 text-foreground font-medium py-2 px-3 rounded-lg"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 12,
                                  height: 12,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 4,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 12, height: 12 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 transition-all duration-300 text-primary-foreground font-medium py-2 px-3 rounded-lg"
                          >
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          <p className="text-xs text-muted-foreground">
            Your votes are encrypted and anonymous until the reveal phase
          </p>
        </CardContent>
      </Card>
    </div>
  );
};