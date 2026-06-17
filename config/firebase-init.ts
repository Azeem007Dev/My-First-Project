// Firebase initialization helper and type definitions
import app, { auth, db, storage } from './firebase';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  CANDIDATES: 'candidates',
  ELECTIONS: 'elections',
  VOTES: 'votes',
  VOTE_COUNTS: 'voteCounts',
} as const;

// User interface for Vote Ledger
export interface VoteLedgerUser {
  uid: string;
  name: string;
  cnic: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  voteBlocks?: VoteBlock[]; // Legacy - will be removed
  electionBlocks?: { [electionId: string]: VoteBlock[] }; // New: election-specific blockchains
}

// Vote block for blockchain (election-specific)
export interface VoteBlock {
  index: number;
  timestamp: number;
  electionId: string; // Election ID is part of the block structure
  voteData: {
    candidateId: string;
    voterHash: string;
  };
  previousHash: string;
  hash: string;
  nonce: number;
}

// Candidate interface
export interface Candidate {
  id?: string;
  name: string;
  party: string;
  symbol: string;
  color: string;
  description: string;
}

// Election interface
export interface Election {
  id?: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  candidates: string[];
  createdAt: Date;
  updatedAt: Date;
  totalVotes?: number;
  totalVoters?: number;
  turnoutPercentage?: number;
}

// Vote interface
export interface Vote {
  id?: string;
  voterId: string;
  candidateId: string;
  electionId: string;
  timestamp: Date;
  transactionHash?: string;
}

// Vote count interface
export interface VoteCount {
  electionId: string;
  candidateId: string;
  count: number;
  lastUpdated: Date;
}

// Export Firebase instances
export { app, auth, db, storage };
export default app;

