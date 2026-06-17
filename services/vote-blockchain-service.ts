/**
 * Vote Blockchain Service
 * Implements a distributed ledger system where each user stores a copy of all vote blocks
 * This creates a tamper-evident voting system
 */

import CryptoJS from 'crypto-js';

/**
 * Structure of a vote block in the blockchain
 * Each election has its own independent blockchain
 */
export interface VoteBlock {
  index: number;
  timestamp: number;
  electionId: string; // Election ID is part of the block structure
  voteData: {
    candidateId: string;
    // Voter ID is hashed for privacy
    voterHash: string;
  };
  previousHash: string;
  hash: string;
  nonce: number; // For additional security
}

/**
 * Create genesis block for a specific election
 */
export function createGenesisBlock(electionId: string): VoteBlock {
  const genesisBlock: VoteBlock = {
    index: 0,
    timestamp: 1697040000000, // Fixed timestamp for genesis
    electionId: electionId,
    voteData: {
      candidateId: 'genesis',
      voterHash: 'genesis',
    },
    previousHash: '0',
    hash: '',
    nonce: 0,
  };
  
  // Calculate genesis block hash
  genesisBlock.hash = calculateBlockHash(genesisBlock);
  return genesisBlock;
}

// Legacy: Keep old GENESIS_BLOCK for backward compatibility (will be removed)
export const GENESIS_BLOCK: VoteBlock = {
  index: 0,
  timestamp: 1697040000000,
  electionId: 'legacy',
  voteData: {
    candidateId: 'genesis',
    voterHash: 'genesis',
  },
  previousHash: '0',
  hash: 'legacy-genesis-hash',
  nonce: 0,
};

/**
 * Calculate hash for a block
 */
export function calculateBlockHash(block: Omit<VoteBlock, 'hash'>): string {
  const data = 
    block.index +
    block.timestamp +
    block.electionId +
    block.voteData.candidateId +
    block.voteData.voterHash +
    block.previousHash +
    block.nonce;
  
  return CryptoJS.SHA256(data).toString();
}

/**
 * Calculate hash for voter ID (for privacy)
 */
export function hashVoterId(voterId: string, salt: string = 'vote-ledger-2025'): string {
  return CryptoJS.SHA256(voterId + salt).toString();
}

/**
 * Create a new vote block
 */
export function createVoteBlock(
  previousBlock: VoteBlock,
  electionId: string,
  candidateId: string,
  voterId: string
): VoteBlock {
  const newBlock: Omit<VoteBlock, 'hash'> = {
    index: previousBlock.index + 1,
    timestamp: Date.now(),
    electionId: electionId,
    voteData: {
      candidateId,
      voterHash: hashVoterId(voterId),
    },
    previousHash: previousBlock.hash,
    nonce: 0,
  };

  // Add proof of work (optional, but adds security)
  const blockWithHash = addProofOfWork(newBlock);
  
  return blockWithHash;
}

/**
 * Add proof of work to a block (simple implementation)
 * Finds a nonce that makes the hash start with '0'
 */
function addProofOfWork(block: Omit<VoteBlock, 'hash'>, difficulty: number = 1): VoteBlock {
  let nonce = 0;
  let hash = '';
  const target = '0'.repeat(difficulty);

  while (true) {
    const tempBlock = { ...block, nonce };
    hash = calculateBlockHash(tempBlock);
    
    if (hash.substring(0, difficulty) === target) {
      break;
    }
    nonce++;
  }

  return {
    ...block,
    nonce,
    hash,
  };
}

/**
 * Validate a single block
 */
export function isValidBlock(block: VoteBlock, previousBlock: VoteBlock): boolean {
  // Check if index is correct
  if (block.index !== previousBlock.index + 1) {
    console.error('Invalid block index');
    return false;
  }

  // Check if previousHash matches
  if (block.previousHash !== previousBlock.hash) {
    console.error('Invalid previous hash');
    return false;
  }

  // Check if hash is calculated correctly
  const calculatedHash = calculateBlockHash({
    index: block.index,
    timestamp: block.timestamp,
    electionId: block.electionId,
    voteData: block.voteData,
    previousHash: block.previousHash,
    nonce: block.nonce,
  });

  if (block.hash !== calculatedHash) {
    console.error('Invalid block hash');
    return false;
  }

  return true;
}

/**
 * Validate entire blockchain for a specific election
 */
export function isValidChain(chain: VoteBlock[], electionId?: string): boolean {
  // Check if chain has genesis block
  if (chain.length === 0) {
    return false;
  }

  // If electionId is provided, ensure all blocks belong to this election
  if (electionId && chain.some(block => block.electionId !== electionId)) {
    console.error(`Chain contains blocks from different elections`);
    return false;
  }

  // Validate genesis block
  const firstBlock = chain[0];
  if (firstBlock.index !== 0 || firstBlock.previousHash !== '0') {
    console.error('Invalid genesis block structure');
    return false;
  }

  // Validate all blocks
  for (let i = 1; i < chain.length; i++) {
    if (!isValidBlock(chain[i], chain[i - 1])) {
      console.error(`Invalid block at index ${i}`);
      return false;
    }
  }

  return true;
}

/**
 * Get the last block in the chain
 */
export function getLastBlock(chain: VoteBlock[]): VoteBlock {
  if (chain.length === 0) {
    return GENESIS_BLOCK;
  }
  return chain[chain.length - 1];
}

/**
 * Check if a user has voted in an election (by checking blockchain)
 */
export function hasVotedInBlockchain(
  chain: VoteBlock[],
  voterId: string,
  electionId: string
): boolean {
  const voterHash = hashVoterId(voterId);
  
  return chain.some(
    block =>
      block.voteData.voterHash === voterHash &&
      block.electionId === electionId
  );
}

/**
 * Get vote counts from blockchain
 */
export function getVoteCountsFromBlockchain(
  chain: VoteBlock[],
  electionId: string
): Map<string, number> {
  const counts = new Map<string, number>();

  chain.forEach(block => {
    if (block.electionId === electionId && block.index > 0) {
      const candidateId = block.voteData.candidateId;
      counts.set(candidateId, (counts.get(candidateId) || 0) + 1);
    }
  });

  return counts;
}

/**
 * Compare two chains to detect tampering
 * Returns true if chains match
 */
export function compareChains(chain1: VoteBlock[], chain2: VoteBlock[]): boolean {
  if (chain1.length !== chain2.length) {
    return false;
  }

  for (let i = 0; i < chain1.length; i++) {
    if (chain1[i].hash !== chain2[i].hash) {
      return false;
    }
  }

  return true;
}

/**
 * Find differences between chains (for audit purposes)
 */
export function findChainDifferences(
  chain1: VoteBlock[],
  chain2: VoteBlock[]
): { index: number; block1: VoteBlock; block2: VoteBlock }[] {
  const differences: { index: number; block1: VoteBlock; block2: VoteBlock }[] = [];
  const maxLength = Math.max(chain1.length, chain2.length);

  for (let i = 0; i < maxLength; i++) {
    const block1 = chain1[i];
    const block2 = chain2[i];

    if (!block1 || !block2 || block1.hash !== block2.hash) {
      differences.push({
        index: i,
        block1: block1 || ({} as VoteBlock),
        block2: block2 || ({} as VoteBlock),
      });
    }
  }

  return differences;
}

/**
 * Blockchain Service Class
 */
export class VoteBlockchainService {
  /**
   * Initialize blockchain for a new user
   * Returns genesis block
   */
  static initializeBlockchain(): VoteBlock[] {
    return [GENESIS_BLOCK];
  }

  /**
   * Add a vote to the blockchain
   */
  static addVote(
    currentChain: VoteBlock[],
    electionId: string,
    candidateId: string,
    voterId: string
  ): VoteBlock[] {
    const lastBlock = getLastBlock(currentChain);
    const newBlock = createVoteBlock(lastBlock, electionId, candidateId, voterId);
    
    return [...currentChain, newBlock];
  }

  /**
   * Validate blockchain integrity
   */
  static validateBlockchain(chain: VoteBlock[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!isValidChain(chain)) {
      errors.push('Blockchain validation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get blockchain statistics
   */
  static getBlockchainStats(chain: VoteBlock[]): {
    totalBlocks: number;
    totalVotes: number;
    genesisHash: string;
    lastBlockHash: string;
    lastBlockTimestamp: number;
  } {
    const lastBlock = getLastBlock(chain);
    
    return {
      totalBlocks: chain.length,
      totalVotes: chain.length - 1, // Exclude genesis block
      genesisHash: chain[0]?.hash || '',
      lastBlockHash: lastBlock.hash,
      lastBlockTimestamp: lastBlock.timestamp,
    };
  }
}

