import { useState, useEffect } from 'react';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

export interface ZamaInstance {
  instance: any | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  initializeZama: () => Promise<void>;
}

export function useZamaInstance(): ZamaInstance {
  const [instance, setInstance] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeZama = async () => {
    if (isLoading || isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 Starting FHE initialization...');
      console.log('📊 Environment check:', {
        ethereum: !!(window as any).ethereum,
        ethereumProvider: (window as any).ethereum?.isMetaMask ? 'MetaMask' : 'Other',
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        isBrowser: typeof window !== 'undefined'
      });

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Zama SDK can only be initialized in browser environment');
      }

      // Check if Ethereum provider is available
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found. Please install MetaMask or another Web3 wallet.');
      }

      console.log('🔄 Step 1: Initializing FHE SDK...');
      await initSDK();
      console.log('✅ FHE SDK initialized successfully');

      console.log('🔄 Step 2: Creating FHE instance with Sepolia config...');
      const config = {
        ...SepoliaConfig,
        network: window.ethereum
      };

      console.log('📊 FHE Config:', {
        network: 'Sepolia',
        ethereumProvider: !!config.network,
        configKeys: Object.keys(config)
      });

      // Add error handling for instance creation
      let zamaInstance;
      try {
        zamaInstance = await createInstance(config);
      } catch (instanceError) {
        console.error('❌ Instance creation failed, trying with basic config:', instanceError);
        // Fallback to basic SepoliaConfig without network
        zamaInstance = await createInstance(SepoliaConfig);
      }
      
      console.log('✅ FHE instance created successfully');
      console.log('📊 Instance methods:', Object.getOwnPropertyNames(zamaInstance).filter(name => typeof zamaInstance[name] === 'function'));

      setInstance(zamaInstance);
      setIsInitialized(true);

      console.log('🎉 FHE initialization completed successfully!');

    } catch (err) {
      console.error('❌ Failed to initialize Zama instance:', err);
      console.error('❌ Error details:', {
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.substring(0, 200) + '...'
      });
      setError(`Failed to initialize encryption service: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeZama();
  }, []);

  return {
    instance,
    isLoading,
    error,
    isInitialized,
    initializeZama
  };
}
