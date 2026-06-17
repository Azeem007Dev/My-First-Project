/**
 * Services Index
 * Central export point for all service classes
 */

export { BaseService } from './base-service';
export type { ApiResponse } from './base-service';

export { SignupService } from './signup-service';
export type { SignUpRequest, SignUpResponse } from './signup-service';

export { SigninService } from './signin-service';
export type { SignInRequest, SignInResponse, VerifyTokenResponse } from './signin-service';

export { VoteService } from './vote-service';
export type { 
  CastVoteRequest, 
  CastVoteResponse, 
  Election, 
  Candidate, 
  VoteCount 
} from './vote-service';

export { AdminService } from './admin-service';
export type { 
  UserProfile as AdminUserProfile, 
  CreateElectionRequest, 
  CreateCandidateRequest 
} from './admin-service';

export { ProfileService } from './profile-service';
export type { 
  UpdateProfileRequest as ProfileUpdateRequest, 
  ChangePasswordRequest as ProfileChangePasswordRequest 
} from './profile-service';

export { UserService } from './user-service';
export type { 
  UserProfile,
  UpdateProfileRequest, 
  ChangePasswordRequest,
  GetProfileResponse,
  UpdateProfileResponse,
  ChangePasswordResponse
} from './user-service';

export { AdminCandidatesService } from './admin-candidates-service';
export type { 
  AdminCandidate,
  AdminCreateCandidateRequest,
  AdminUpdateCandidateRequest,
  GetCandidatesResponse,
  CandidateResponse
} from './admin-candidates-service';

export { AdminElectionsService } from './admin-elections-service';
export type {
  AdminElection,
  CreateElectionRequest as AdminCreateElectionRequest,
  UpdateElectionStatusRequest,
  DeployResultsRequest,
  GetElectionsResponse,
  ElectionResponse,
  ElectionStatsResponse,
  AdminStatsResponse
} from './admin-elections-service';

export { VoteBlockchainService } from './vote-blockchain-service';
export type {
  VoteBlock
} from './vote-blockchain-service';
export {
  GENESIS_BLOCK,
  calculateBlockHash,
  hashVoterId,
  createVoteBlock,
  isValidBlock,
  isValidChain,
  getLastBlock,
  hasVotedInBlockchain,
  getVoteCountsFromBlockchain,
  compareChains,
  findChainDifferences
} from './vote-blockchain-service';

