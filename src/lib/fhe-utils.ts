// FHE encryption utilities for confidential voting
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

export interface EncryptedVote {
  encryptedScore: string;
  proof: string;
  timestamp: number;
  handles: string[];
}

export interface VoteData {
  projectId: number;
  score: number;
  sessionId: number;
  voterAddress: string;
}

export class FHEVotingUtils {
  private instance: any | null = null;
  private contractAddress: string;

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
    this.initializeFHE();
  }

  private async initializeFHE() {
    try {
      console.log('🚀 Initializing FHE Voting Utils...');
      console.log('📊 Contract address:', this.contractAddress);
      
      // Initialize FHE instance for client-side encryption
      await initSDK();
      console.log('✅ FHE SDK initialized');
      
      this.instance = await createInstance(SepoliaConfig);
      console.log('✅ FHE instance created successfully');
      console.log('📊 Available methods:', Object.getOwnPropertyNames(this.instance).filter(name => typeof this.instance[name] === 'function'));
    } catch (error) {
      console.error('❌ Failed to initialize FHE:', error);
      throw error;
    }
  }

  /**
   * Encrypt vote data using FHE
   */
  async encryptVote(voteData: VoteData): Promise<EncryptedVote> {
    try {
      console.log('🚀 Starting vote encryption process...');
      console.log('📊 Vote data:', voteData);

      if (!this.instance) {
        throw new Error('FHE instance not initialized');
      }

      // Validate input parameters
      if (voteData.score < 1 || voteData.score > 10) {
        throw new Error('Score must be between 1 and 10');
      }
      if (!voteData.voterAddress || voteData.voterAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid voter address');
      }

      // Create encrypted input for the contract
      console.log('🔄 Step 1: Creating encrypted input...');
      const input = this.instance.createEncryptedInput(this.contractAddress, voteData.voterAddress);
      
      // Add the score (1-10) as euint32
      console.log('🔄 Step 2: Adding score to encrypted input...');
      input.add32(voteData.score);
      
      // Encrypt the input
      console.log('🔄 Step 3: Encrypting data...');
      const encryptedInput = await input.encrypt();
      console.log('✅ Encryption completed, handles count:', encryptedInput.handles.length);
      
      // Convert handles to proper format (32 bytes)
      const handles = encryptedInput.handles.map((handle: any) => this.convertToBytes32(handle));
      
      console.log('📊 Encryption result:', {
        handlesCount: handles.length,
        proofLength: encryptedInput.inputProof.length,
        timestamp: Date.now()
      });
      
      return {
        encryptedScore: handles[0],
        proof: `0x${Array.from(encryptedInput.inputProof)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')}`,
        timestamp: Date.now(),
        handles
      };
    } catch (error) {
      console.error('❌ Failed to encrypt vote:', error);
      throw new Error(`Vote encryption failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Convert FHE handle to bytes32 format
   */
  private convertToBytes32(handle: any): string {
    if (handle instanceof Uint8Array) {
      const hex = Array.from(handle)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return `0x${hex}`;
    } else if (typeof handle === 'string') {
      return handle.startsWith('0x') ? handle : `0x${handle}`;
    } else if (Array.isArray(handle)) {
      const hex = handle.map(b => b.toString(16).padStart(2, '0')).join('');
      return `0x${hex}`;
    }
    return `0x${handle.toString()}`;
  }

  /**
   * Decrypt vote data using FHE handles
   */
  async decryptVote(handleContractPairs: Array<{handle: string, contractAddress: string}>): Promise<Record<string, any>> {
    try {
      if (!this.instance) {
        throw new Error('FHE instance not initialized');
      }

      const result = await this.instance.userDecrypt(handleContractPairs);
      return result;
    } catch (error) {
      console.error('Failed to decrypt vote:', error);
      throw new Error('Vote decryption failed');
    }
  }

  /**
   * Generate external euint32 for contract interaction
   */
  async generateExternalEuint32(score: number, voterAddress: string): Promise<{
    encrypted: string;
    proof: string;
  }> {
    try {
      console.log('🚀 Generating external euint32...');
      console.log('📊 Parameters:', { score, voterAddress });

      if (!this.instance) {
        throw new Error('FHE instance not initialized');
      }

      // Validate input parameters
      if (score < 1 || score > 10) {
        throw new Error('Score must be between 1 and 10');
      }
      if (!voterAddress || voterAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid voter address');
      }

      console.log('🔄 Step 1: Creating encrypted input...');
      const input = this.instance.createEncryptedInput(this.contractAddress, voterAddress);
      
      console.log('🔄 Step 2: Adding score to encrypted input...');
      input.add32(score);
      
      console.log('🔄 Step 3: Encrypting data...');
      const encryptedInput = await input.encrypt();
      console.log('✅ Encryption completed');

      const encrypted = this.convertToBytes32(encryptedInput.handles[0]);
      const proof = `0x${Array.from(encryptedInput.inputProof)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('')}`;

      console.log('📊 External euint32 result:', {
        encrypted: encrypted.substring(0, 20) + '...',
        proofLength: proof.length
      });

      return {
        encrypted,
        proof
      };
    } catch (error) {
      console.error('❌ Failed to generate external euint32:', error);
      throw error;
    }
  }

  /**
   * Verify vote proof
   */
  async verifyProof(proof: string, expectedVoter: string): Promise<boolean> {
    try {
      // In a real implementation, this would verify the cryptographic proof
      // For now, we'll do basic validation
      return proof.startsWith('0x') && proof.length > 10;
    } catch (error) {
      console.error('Failed to verify proof:', error);
      return false;
    }
  }

  /**
   * Get instance status
   */
  isInitialized(): boolean {
    return this.instance !== null;
  }
}

// Export singleton instance
export const fheVotingUtils = new FHEVotingUtils(
  import.meta.env.VITE_VOTING_CONTRACT_ADDRESS || '0x2c6216Ac4d65d7d2720Cc45c11Da554CdB06Dcba'
);
