```
1. Introduction
```

```
The integrity and reliability of voting systems are critical in preserving the
trust of citizens and stakeholders in democratic processes. Traditional voting
systems, whether paper-based or electronic, have several drawbacks, including
voter fraud, ballot tampering, and logistical inefficiencies. Such problems not
only compromise the transparency of elections but also erode public confidence
in the system. Furthermore, the physical limitations of traditional polling
often result in lower voter turnout due to geographical constraints, long
waiting times, and administrative overhead.
```

```
As technological advancements continue to shape various domains, the voting
process remains in need of modernization. This project proposes "Vote Ledger", a
decentralized, Blockchain-based voting system designed to ensure secure, tamper-
resistant vote recording. By providing an immutable ledger to securely store
votes and incorporating smart contracts to automate vote counting and result
validation, this project addresses core concerns of transparency, efficiency,
and trust. Ultimately, this system aims to bridge the gap between technology and
civic duty, making elections more accessible, secure, and reliable for everyone.
1.1 Project Title
Vote Ledger: A Privacy-Preserving, AI-Enhanced Decentralized Blockchain Voting
System with Zero-Knowledge Proof Authentication
```

```
1.2 Project Overview Statement
```

```
Vote Ledger addresses critical weaknesses in traditional voting systems — ballot
tampering, double voting, identity fraud, and lack of auditability — by
proposing a university and organizational-level decentralized e-voting platform
built on a Private Ethereum blockchain using Proof of Authority (PoA) consensus.
The system integrates SHA-256 hashing, RSA-2048 public/private key cryptography,
and digital signatures to ensure vote integrity. To resolve the tension between
voter anonymity and election transparency, conceptual Zero-Knowledge Proof (ZKP)
techniques are incorporated, enabling eligibility verification without identity
disclosure. A key innovation is the AI-based anomaly detection module that
monitors voting metadata in real time using Isolation Forest machine learning to
identify suspicious or fraudulent behavior, without compromising voter privacy
or enabling deanonymization. Identity verification uses a realistic CNIC-
simulated OTP/email authentication system with wallet-based identity mapping.
```

```
Project Title: Vote Ledger: A Privacy-Preserving, AI-Enhanced Decentralized
Blockchain Voting System
```

```
Group Leader: Muhammad Hussnain Shahid (B-28067)
Project Members:
```

```
NameRegistration #Email AddressSignature
Muhammad Hussnain ShahidB-28067iamhussnainshahid@gmail.com
Syed Muhammad AzeemB-28160syedmuhammadazeem01@gmail.com
Hamdan IshtiaqB-28164hamdanishtiaq60@gmail.com
```

```
Project Goal: To develop a privacy-preserving, decentralized blockchain-based
voting platform for university and organizational elections, integrating AI-
based anomaly detection to identify fraudulent voting patterns while maintaining
full voter anonymity through cryptographic techniques.
Objectives:
```

`1. Deploy a Private Ethereum (Ganache/PoA) blockchain for tamper-proof vote recording.` 

`2. Implement SHA-256 hashing, RSA-2048 encryption, and digital signatures for vote integrity.` 

`3. Apply conceptual Zero-Knowledge Proofs for anonymity-transparency balance.` 

`4. Build CNIC-simulated OTP-based identity verification with wallet-address mapping.` 

`5. Develop an ML-based anomaly detection module (Isolation Forest) on voting metadata.` 

```
  6. Deliver a complete end-to-end 10-stage voting data flow pipeline.
Sr.#
1Ensure Secure Voting
2Improve on Transparency
3Provide Voter Privacy
4Ensure Accessibility
5Real-time Results
6Conformity to the Law
```

```
Project Success Criteria:
  • 100% vote accuracy — every submitted vote matches on-chain record.
  • Zero duplicate votes accepted — smart contract enforces strict validation.
  • Transaction time < 2 seconds on local Ganache network.
  • AI anomaly detection accuracy > 85% on simulated fraud dataset.
  • False positive rate < 5% to avoid flagging legitimate voters.
  • System uptime > 99.5% during active election periods.
Assumptions, Risks and Obstacles:
  Assumptions: University IT infrastructure can support local Ganache node
deployment; students have access to CNIC numbers for registration simulation;
test environment simulates concurrent voting load adequately.
  Risks: Smart contract vulnerabilities (mitigated via OpenZeppelin + Slither
audit); AI false positives (mitigated via threshold tuning); timeline slippage
(mitigated via milestone-based Gantt chart with buffer weeks).
Organization: University of South Asia, Department of Computer Science
```

```
Type of Project:☐ Research   Development☑
Target End Users: University students and staff (elections), corporate board
members (governance voting), departmental committees (institutional decisions).
Development Technology:☑ Object Oriented☐ Structured
Platform:☑ Web based☑ Distributed   Desktop based   Setup Configurations☐☐
Suggested Project Supervisor: Dr. Nadeem Asif
Approved By:
Date: 08-04-2026
1.4 Role and Responsibilities
RolesName & Responsibilities
Supervisor CoordinatorDr. Nadeem Asif/ Mr. Zaid Bin Javaid
Requirement EngineerMuhammad Hussnain Shahid
AnalysisHamdan Ishtiaq
DesignerSyed Muhammad Azeem
CodingMuhammad Hussnain Shahid
DocumentationHamdan Ishtiaq
```

```
1.5 Project Goals & Objectives
Ensure Vote Integrity:  Deploy immutable smart contracts on a Private
Ethereum (Ganache) chain with Proof of Authority consensus to guarantee tamper-
proof, auditable vote recording.
Guarantee Voter Privacy:  Implement SHA-256 hashing, RSA-2048
public/private key encryption, digital signatures, and conceptual Zero-Knowledge
Proofs to protect voter anonymity throughout the process.
Detect Fraudulent Activity:  Develop an ML-based anomaly detection module
(Isolation Forest, Scikit-learn) analyzing voting metadata to identify
suspicious patterns without deanonymizing voters.
Realistic Identity Verification:  Implement a three-layer authentication
flow — CNIC simulation + password, OTP via email (5-minute expiry), and
cryptographic wallet-based identity mapping.
Ensure Accessibility:  Deliver a responsive web interface (HTML/CSS/JS)
for voter participation and an admin panel for election management, usable
across desktop and mobile browsers.
Real-time Results:  Smart contracts automatically tally votes and publish
results upon election closure, eliminating manual counting delays and human
error.
```

```
1.6 High-level system components
```

```
Voter Interface (Frontend): Responsive web application (HTML/CSS/JS) for
voter login, two-factor authentication, ballot display, and vote submission with
digital signature.
```

```
Admin Panel: Secure administrative interface for election creation, voter
roll management, real-time monitoring, anomaly alerts, and post-election result
viewing.
```

```
Identity Verification Module: CNIC-simulated verification with OTP/email
two-factor authentication and cryptographic wallet-based identity mapping — no
PII stored on-chain.
```

```
Cryptographic Key Module: Generates RSA-2048 public/private key pairs per
voter session for vote encryption and digital signature generation; keys are
session-scoped.
```

```
Smart Contracts (Solidity): ElectionManager.sol and VotingContract.sol
deployed on Ganache — manage voter validation, duplicate prevention, encrypted
vote storage, and automated tallying with OpenZeppelin security patterns.
```

```
AI Anomaly Detection Module: Python/Scikit-learn module using Isolation
Forest to analyze voting metadata (timestamps, session duration, frequency) for
fraud detection, integrated via Flask REST API.
```

## `1.7 List of optional functional units` 

```
Biometric Login Integration: Fingerprint/facial recognition via WebAuthn
API on supported devices. Target: < 1.5 second authentication time; 99%
recognition accuracy on test devices.
```

```
Multi-language Support (Urdu/English): Frontend internationalization using
i18next library. Target: Full Urdu/English UI translation; < 100ms language
switch time.
```

```
Advanced Analytics Dashboard: Real-time voting trend visualization with
Chart.js for administrators. Target: Dashboard refresh < 5 seconds; supports 10
concurrent admin sessions.
```

```
SMS/Email Notifications: Automated vote confirmation alerts via
Nodemailer/Twilio. Target: Delivery within 30 seconds of vote submission; 99%
delivery success rate.
```

## `1.8 Exclusions` 

```
Physical Hardware Provision: This project is strictly a software solution
and will not include the manufacturing or provisioning of physical Electronic
Voting Machines (EVMs) or polling booth hardware.
```

```
National Database Direct Integration: Real-time integration with NADRA or
any government citizen database is outside FYP scope; identity verification is
simulated using a local mock database with CNIC hashing.
```

```
National-Level Elections: The system is explicitly scoped to university
and organizational-level elections only. National-level deployment is excluded
due to legal, regulatory, and scalability constraints beyond this project.
```

## `1.9 Application Architecture` 

```
The application architecture follows a five-layer decentralized approach:
1.Frontend Layer: Voter Interface and Admin Panel communicating via HTTPS
with the middleware layer.
```

```
2.Middleware Layer: Web3.js/Ethers.js bridge, authentication controller, and
OTP email service.
3.Identity Module: CNIC simulation database, wallet address mapper, and
digital signature verifier.
```

```
Figure 1 Application Architecture
```

## `2.0 Gantt chart` 

```
Figure 2 Gantt Chart
```

- `2.1 Hardware and Software Specification` 

- `Hardware Requirements:` 

- `Processor: Intel Core i5 / AMD Ryzen 5 or better (for smart contract` 

```
compilation and AI model training).
```

```
•RAM: Minimum 8 GB (16 GB recommended for concurrent Ganache node, AI
module, and frontend processes).
```

- `Storage: 50 GB available SSD storage.` 

- `Network: Active internet connection (for OTP email delivery service).` 

- `• Software Requirements:` 

- `Operating System: Windows 10/11, Linux Ubuntu 20.04+, or macOS 12+.` 

- `Development Tools: Visual Studio Code, Truffle Suite v5.x, Node.js v18+,` 

- `Python 3.10+.` 

```
•Browsers: Google Chrome or Mozilla Firefox with MetaMask/Web3 wallet
extension enabled.
```

## `2.2 Tools and technologies used with reasoning` 

```
•Solidity 0.8.x: Industry-standard smart contract language for Ethereum-
compatible chains. Version 0.8.x selected for built-in integer overflow
protection, current security standards, and OpenZeppelin library compatibility.
```

```
•Ganache (Truffle Suite): Local Private Ethereum simulation enabling rapid
development and testing without real gas costs or mainnet dependencies. Supports
PoA consensus configuration and persistent state snapshots.
```

```
•HTML, CSS, and JavaScript: Used to build a fully responsive, accessible
voter and admin interface. Ensures cross-browser compatibility and mobile-
friendly design without native app development overhead.
```

```
•Web3.js / Ethers.js: Proven JavaScript libraries for secure frontend-to-
blockchain communication with comprehensive Ethereum ABI encoding, event
listening, and wallet integration support.
Python 3.x + Scikit-learn: Powers the AI anomaly detection module. Scikit-learn
provides mature, efficient Isolation Forest and K-Means implementations. Flask
exposes the AI module as a REST API to the Node.js backend.
OpenZeppelin Contracts: Audited smart contract security library providing
ReentrancyGuard, Ownable, and SafeMath patterns to minimize vulnerability
surface area in deployed contracts.
```

## `2.3 AI Integration Module (Mandatory)` 

## `2.3.1 Overview and Justification` 

```
Blockchain guarantees that votes are tamper-proof after submission, but it has
no mechanism to detect coordinated fraud or suspicious voting behavior before or
during the election. The AI module fills this critical gap. It monitors voting
session metadata in real time using machine learning to identify potentially
fraudulent patterns, while never accessing vote content or revealing voter
identity. This makes the system both secure at the data layer and intelligent at
the behavioral layer.
```

## `2.3.2 Selected ML Technique: Isolation Forest (Primary) + K-Means Clustering` 

## `(Secondary)` 

```
Isolation Forest is selected as the primary anomaly detection model because it
is specifically designed for scenarios with no labeled fraud examples — exactly
the situation in a newly deployed voting system. It works by randomly isolating
data points in decision trees; anomalous sessions are isolated much faster than
normal ones, producing an anomaly score. K-Means Clustering is used as a
secondary layer to group voting sessions by behavioral profile and flag sessions
that fall outside all normal clusters. Both models operate entirely on metadata
and produce no output that could identify a voter.
```

## `2.3.3 Input Features (Metadata Only — No Vote Content or Voter Identity):` 

- `Voting timestamp and time-of-day pattern` 

- `Session duration (time elapsed between login and vote submission)` 

- `Number of failed login attempts before successful authentication` 

- `Voting frequency per IP subnet (rate-based anomaly)` 

- `Deviation from established historical baseline voting patterns` 

```
2.3.4 How AI Enhances the System:
```

```
Security: The AI module detects coordinated bot attacks, unusually rapid vote
submissions, and repeated failed authentication bursts that indicate credential
stuffing or automated fraud attempts.
```

```
Transparency: Administrators receive an anomaly score dashboard showing overall
voting pattern health across the election period, without any individual vote
content being exposed.
```

```
Decision Support: Flagged sessions are presented to administrators with only a
session ID and anomaly score — the AI never takes autonomous punitive action.
All decisions remain with human administrators, preserving due process and
fairness.
```

## `2.3.5 Privacy Preservation — No Deanonymization:` 

```
The AI pipeline is designed so that voter deanonymization is architecturally
impossible. The module receives only anonymized session tokens and behavioral
metadata. No CNIC number, voter name, wallet address, or vote selection is ever
passed into the AI pipeline. Flagged outputs contain only a session ID and an
anomaly score. No model output can be reverse-engineered to identify a specific
voter. This ensures that fraud detection does not come at the cost of the voter
anonymity guaranteed by the cryptographic layer.
```

```
2.3.6 AI Technology Stack:
```

```
•Python 3.10+ with Scikit-learn 1.3+ — Isolation Forest and K-Means
implementation
```

- `Pandas and NumPy — metadata preprocessing and feature engineering` 

```
•Flask REST API — integrates the Python AI module with the Node.js/Web3
backend
```

```
•Matplotlib / Seaborn — anomaly pattern visualization on the admin
dashboard
```

```
•TensorFlow (optional phase) — reserved for supervised deep learning if
labeled fraud data becomes available
```

## `2.3.7 AI Testing and Evaluation Plan:` 

```
•Simulated fraud dataset generated with rapid-fire sessions, bot-pattern
intervals, and abnormal login attempts
```

```
•Isolation Forest evaluated on precision, recall, and F1-score against test
dataset
```

```
•Target anomaly detection accuracy: > 85%
•Acceptable false positive rate: < 5% (to protect legitimate voters from
being flagged)
•Privacy audit: verified that no voter identity data enters the AI module
at any pipeline stage
```

```
•AI module integrated and tested via Flask API calls from the Node.js
backend
```

```
Figure 3 AI Integration Module Architecture — End-to-end pipeline from
blockchain event to admin alert dashboard
```

```
3.0 Literature Review
```

> `A comprehensive review of ten existing blockchain-based e-voting systems was conducted to identify research gaps and position Vote Ledger within current academic discourse. The comparison table below evaluates each system across seven key dimensions.` 

```
Author/YearSystem
```

```
BlockchainPrivacyAIScalabilityKey Limitation
```

```
Ayed (2017)E-voting on EthereumPublic ETHLowNoLowNo anonymity,
gas fees
Hjálmarsson et al. (2018)Blockchain e-votingEthereumMediumNo
MediumScalability issues
Hardwick et al. (2018)E-voting systemEthereumMediumNoLow
High mainnet cost
Khan et al. (2020)Secure VotingHyperledgerHighNoMediumNo
AI integration
Abuidris et al. (2021)Voting SurveyMultipleMediumNoVaries
Theoretical only
Chowdhury et al. (2019)Blockchain VotingPermissionedHighNoHigh
Weak identity mgmt
Wang et al. (2022)Smart Contract VotingEthereumHighPartial
MediumLimited fraud detect
Zhang et al. (2023)AI+Blockchain VotingPrivateHighYesHigh
Prototype only
Ali et al. (2023)PKI-based E-votingEthereumHighNoMediumNo
anomaly detection
NIST (2023)Post-Quantum CryptoN/AHighNoN/AStandard doc only
Vote Ledger (Proposed)Privacy+AI+BlockchainPrivate ETHZKP+HashYes (ML)
HighUnder development
```

```
The table confirms that Vote Ledger is the only system in this review to combine
privacy-preserving cryptographic techniques (ZKP, SHA-256) with AI-based anomaly
detection on a private Ethereum chain — directly addressing the identified
research gap.
```

## `3.1 Smart Contract Design` 

```
Two Solidity smart contracts are deployed on the Ganache private Ethereum
network:
ElectionManager.sol —
Handles election lifecycle: creation, candidate registration, voter roll
management, and open/close state transitions. Restricted to admin wallet via
OpenZeppelin Ownable pattern.
VotingContract.sol —
```

```
Manages voter eligibility validation using wallet-address mapping, vote casting
with duplicate prevention via a hasVoted mapping, encrypted vote storage, and
automated tallying upon election closure.
```

```
Key functions: registerVoter(address, bytes32 cnicHash), castVote(uint
candidateId, bytes signature), getResults() — restricted post-election,
closeElection() — admin only.
```

```
Security patterns applied: OpenZeppelin ReentrancyGuard on castVote(), Solidity
0.8.x built-in overflow protection, Ownable access control, event emission for
all critical actions (VoterRegistered, VoteCast, ElectionClosed).
```

## `3.2 Complete Voting Data Flow Pipeline` 

```
The complete end-to-end data flow for a voter session proceeds through ten
stages:
```

```
Step 1 — Login: Voter enters CNIC and password on the frontend interface.
Step 2 — OTP Verification: System sends a one-time password to the registered
email address (5-minute expiry).
```

```
Step 3 — Identity Mapping: Verified CNIC hash is mapped to a unique blockchain
wallet address via the identity module.
```

```
Step 4 — Key Generation: RSA-2048 public/private key pair generated for the
session; private key signs the vote.
```

```
Step 5 — Vote Encryption: Vote selection encrypted using the voter's public key
before transmission.
```

```
Step 6 — Blockchain Submission: Encrypted vote and digital signature submitted
as a transaction to VotingContract.sol.
```

```
Step 7 — Smart Contract Validation: Contract verifies digital signature, checks
hasVoted mapping, records vote if valid.
```

```
Step 8 — Immutable Storage: Validated vote stored permanently on the Ganache
```

```
blockchain ledger.
```

```
Step 9 — AI Metadata Logging: Voting timestamp, session duration, and behavioral
metadata forwarded to AI module (no vote content).
Step 10 — Result Computation: Smart contract automatically tallies votes and
publishes results after election closure.
```

## `3.3 Security Model` 

```
The security model covers four layers of protection:
SHA-256 Hashing: Each vote is hashed before submission. Any post-submission
tampering produces a different hash, immediately detectable during audit.
RSA-2048 Encryption + Digital Signatures: Public/private key pairs generated per
session. Private key signs the vote; public key verifies the signature. Non-
repudiation guaranteed.
Zero-Knowledge Proofs (Conceptual): ZKP techniques allow the system to verify
voter eligibility without revealing which candidate they voted for, resolving
the anonymity-transparency conflict.
```

```
Key Management: Session-scoped keys only — private keys are never stored server-
side. Wallet-to-CNIC mapping uses irreversible SHA-256 hash; original CNIC never
persisted.
```

## `Threat Mitigation:` 

```
Double Voting: Smart contract hasVoted mapping blocks any duplicate submission
with event log.
Replay Attacks: Each transaction includes a unique nonce and timestamp; replayed
transactions rejected.
Identity Spoofing: CNIC hash + OTP verification ensures only registered
individual can access the corresponding wallet.
Smart Contract Reentrancy: OpenZeppelin ReentrancyGuard applied to all state-
changing functions.
Integer Overflow: Solidity 0.8.x built-in protection; SafeMath referenced for
additional safety.
```

## `3.4 UML Diagrams` 

```
Four UML diagrams are defined for the system. Actual rendered diagrams to be
inserted in final printed submission.
```

```
Actors: Voter, Admin, Smart Contract, AI Module. Voter use cases: Register,
Login+OTP, Cast Vote, View Results. Admin: Create Election, Manage Voter Roll,
Monitor Anomalies, Close Election, View Audit Log. Smart Contract: Validate
Vote, Prevent Duplicate, Tally Results. AI Module: Log Metadata, Detect Anomaly,
Alert Admin.
```

```
Class Diagram (Figure 3)
Classes: Voter(cnicHash, walletAddress, hasVoted, sessionToken),
Election(electionId, title, candidates, status, startTime, endTime),
Vote(voteId, encryptedContent, signature, timestamp),
SmartContract(registerVoter(), castVote(), getResults()),
AnomalyDetector(features[], isolationForest, predict(), alertAdmin()).
```

## `Sequence Diagram (Figure 4)` 

```
Flow: Voter enters CNIC+Password → Backend validates → Email OTP sent → OTP
verified → KeyModule generates RSA pair → Ballot displayed → Vote selected →
Encrypted+Signed → SmartContract validates → Ganache records → AI logs metadata
→ VoteCast event emitted → Confirmation shown to voter.
```

```
Activity Diagram (Figure 5)
```

```
Flow: Start → Enter Credentials → [Valid? No→Retry/Lock; Yes→] Send OTP → [OTP
Valid? No→Resend; Yes→] Generate Keys → Display Ballot → Cast Vote → [Duplicate?
Yes→Reject+Log; No→] Encrypt+Sign → Submit to Blockchain → Log to AI → [Anomaly?
Yes→Alert Admin] → Confirm to Voter → End.
```

## `3.5 Testing and Validation Plan` 

```
Functional Testing: Voter registration with valid/invalid CNIC inputs; OTP
delivery and expiry validation; vote casting with correct and tampered
```

```
signatures; duplicate vote rejection; election lifecycle (create, open, close);
result retrieval restricted to post-election period.
```

```
Smart Contract Testing: Unit tests in JavaScript using Truffle/Hardhat;
reentrancy attack simulation; overflow condition testing; gas consumption
benchmarking; edge cases (zero candidates, single voter, concurrent
submissions).
```

```
Security Testing: Replay attack simulation with captured transaction data;
identity spoofing with mismatched CNIC-wallet pairs; OWASP Top 10 checklist on
web frontend; SQL injection testing on identity module.
```

```
AI Module Testing: Simulated fraud dataset with rapid-fire sessions and bot-like
patterns; Isolation Forest precision/recall evaluation; false positive rate
measurement (target < 5%); privacy audit confirming no voter identity enters AI
pipeline.
```

```
Performance Testing: Transaction throughput target > 50 votes/minute on Ganache;
smart contract response time < 2 seconds; system uptime > 99.5% during election;
frontend load time < 3 seconds.
```

```
Evaluation Metrics: Vote Accuracy 100%; Transaction Time < 2s; Throughput > 50
tx/min; Anomaly Detection Accuracy > 85%; False Positive Rate < 5%.
```

```
3.6 Implementation Plan
```

```
The implementation plan follows the approved project Gantt chart, commencing
from the proposal approval date of 8th April 2026. The project is structured
across six phases spanning April 2026 to December 2026:
```

```
Phase 1 — Initial Research & Proposal (5-Apr-26 to 7-May-26 | 30 Days): Set up
development environment: VS Code, Truffle Suite, Ganache, Solidity 0.8.x,
Node.js v18+. Conduct initial research on blockchain voting and AI anomaly
detection. Define system scope, objectives, and project requirements.
```

```
Phase 1.1 — Market Research & Scope Definition (6-Apr-26 to 11-Apr-26 | 5 Days):
Conduct stakeholder analysis for university election use case. Define
organizational voting requirements. Finalize project exclusions (national
elections, NADRA integration). Document scope boundaries in proposal.
```

```
Phase 1.2 — Technical Requirements & Planning (18-Apr-26 to 27-Apr-26 | 10
Days): Define all functional and non-functional requirements. Specify blockchain
architecture (Private Ethereum, PoA, Ganache). Draft smart contract interfaces
for ElectionManager.sol and VotingContract.sol. Plan AI module pipeline and
complete data flow.
```

```
Phase 1.3 — Final Proposal Submission (28-Apr-26 to 1-May-26 | 3 Days): Finalize
revised FYP proposal incorporating all 30 coordinator feedback points. Complete
Comments & Replied document with page references.
```

```
Phase 2 — System Architecture & Design (6-May-26 to 31-May-26 | 55 Days): Design
complete five-layer system architecture: Frontend Layer, Middleware Layer,
Identity Module, Blockchain Layer, and AI Module. Define database schema for
CNIC simulation and voter registration.
```

```
Phase 2.1 — UI/UX Wireframing & Prototyping (8-May-26 to 22-May-26 | 15 Days):
Design wireframes for Voter Interface (login, OTP, ballot, confirmation) and
Admin Panel (election management, anomaly dashboard). Create interactive
prototype for supervisor review.
```

```
Phase 2.2 — UML Diagrams — Use Case, Sequence, ERD (22-May-26 to 6-Jun-26 | 15
Days): Develop all four UML diagrams: Use Case Diagram (4 actors, 13 use cases),
Class Diagram (5 classes), Sequence Diagram (17 steps), Activity Diagram. Create
entity-relationship diagram for identity module database.
```

```
Phase 2.3 — Database & Blockchain Schema Design (7-Jun-26 to 21-Jun-26 | 15
Days): Design voter registration database schema using CNIC hash as primary key.
Define blockchain data structures for both smart contracts. Map wallet address
to CNIC hash relationship.
```

```
Phase 3 — Blockchain & Smart Contract Development (22-Jun-26 to 11-Jul-26 | 80
Days): Core blockchain development phase — deploy and test all smart contracts
on Ganache Private Ethereum with PoA consensus.
```

```
Phase 3.1 — Blockchain Network & Environment Setup (22-Jun-26 to 11-Jul-26 | 20
Days): Configure Ganache private Ethereum network with Proof of Authority
consensus. Set up Truffle project structure, migration scripts, and testing
framework. Configure simulated gas handling.
```

```
Phase 3.2 — Smart Contract Coding in Solidity (12-Jul-26 to 31-Jul-26 | 20
Days): Develop ElectionManager.sol and VotingContract.sol. Implement voter
validation via hasVoted mapping, duplicate prevention, automated tallying. Apply
OpenZeppelin ReentrancyGuard and Ownable security patterns. Implement SHA-256
vote hashing and digital signature verification.
```

```
Phase 3.3 — Encryption & Identity Module (1-Aug-26 to 20-Aug-26 | 20 Days):
Build RSA-2048 key generation module for session-scoped public/private key
pairs. Implement CNIC-simulated identity database with SHA-256 hashing. Develop
OTP email authentication service with 5-minute expiry and account lockout. Build
wallet-address-to-CNIC-hash mapping module.
```

```
Phase 4 — Frontend & Dashboard Development (21-Aug-26 to 4-Oct-26 | 45 Days):
Full frontend development phase — build responsive voter interface and admin
dashboard, integrate with blockchain layer via Web3.js.
```

```
Phase 4.1 — Voter & Admin Interface Implementation (21-Aug-26 to 4-Sep-26 | 15
Days): Build responsive voter interface (HTML/CSS/JS): login page, OTP
verification, ballot display, confirmation screen. Build admin panel: election
creation, voter roll management, real-time monitoring, result view.
```

```
Phase 4.2 — UI Component Integration (5-Sep-26 to 19-Sep-26 | 15 Days):
Integrate frontend components with identity verification module and OTP service.
Connect ballot interface to smart contract events via Web3.js. Implement wallet
connection for voter session management.
```

```
Phase 4.3 — Web3 API and Linkage Setup (20-Sep-26 to 4-Oct-26 | 15 Days):
Configure Web3.js/Ethers.js blockchain bridge. Set up event listeners for
VoteCast and VoterRegistered contract events. Implement and test complete 10-
stage voting data flow pipeline. Connect AI metadata logger to blockchain event
stream via Flask REST API.
```

```
Phase 5 — Integration & System Testing (5-Oct-26 to 18-Nov-26 | 45 Days): Full
integration and testing phase — functional, security, smart contract,
performance, and AI module testing.
```

```
Phase 5.1 — Full Backend & Frontend Integration (5-Oct-26 to 19-Oct-26 | 15
Days): Integrate all modules: identity verification, smart contracts, AI anomaly
detection module (Isolation Forest via Flask API), and responsive frontend. Test
complete end-to-end data flow pipeline across all 10 stages.
```

```
Phase 5.2 — Quality Assurance & Bug Fixing (20-Oct-26 to 3-Nov-26 | 15 Days):
Execute functional test suite: voter registration, OTP flow, duplicate vote
prevention, election lifecycle. Run AI module tests on simulated fraud dataset —
evaluate Isolation Forest precision/recall, verify false positive rate < 5%. Fix
identified bugs.
```

```
Phase 5.3 — System Security & Performance Audit (4-Nov-26 to 18-Nov-26 | 15
Days): Run Slither static analysis on deployed smart contracts. Simulate
reentrancy and replay attacks. Apply OWASP Top 10 checklist to web frontend.
Benchmark transaction throughput (target > 50 tx/min) and response time (target
< 2s). Verify 100% vote accuracy.
```

```
Phase 6 — Documentation & Final Delivery (19-Nov-26 to 18-Dec-26 | 30 Days):
```

```
Final documentation, report compilation, and project delivery phase.
```

```
Phase 6.1 — Final Project Report Compilation (19-Nov-26 to 28-Nov-26 | 10 Days):
Compile complete FYP report including all sections: Literature Review, System
Architecture, Security Model, UML Diagrams, AI Module documentation, Testing
Results, and IEEE References.
```

```
Phase 6.2 — Presentation & Demo Preparation (22-Nov-26 to 8-Dec-26 | 10 Days):
Prepare final project presentation slides. Set up live demonstration environment
on local Ganache network. Prepare demo script covering all key system features
including AI anomaly detection dashboard.
```

```
Phase 6.3 — Final FYP Submission (9-Dec-26 to 18-Dec-26 | 10 Days): Submit
complete FYP documentation, source code repository (GitHub with branch
protection), and deployed system to department. Prepare for final viva.
```

```
Key Milestones: M1 — Proposal approved (8-Apr-26); M2 — Architecture & UML
finalized (Jun-26); M3 — Smart contracts deployed & tested (Jul-26); M4 —
Integrated system functional (Oct-26); M5 — AI module integrated & tested
(Nov-26); M6 — Final FYP submission (Dec-26).
```

## `3.7 Real-World Use Cases` 

```
University Elections: Student body elections, departmental representative
elections, and faculty senate votes. System accommodates thousands of registered
student voters with automated roll verification.
Corporate Board Voting: Board resolutions, shareholder proxy voting, and
corporate governance decisions requiring the combination of privacy,
verifiability, and auditability that Vote Ledger provides.
Departmental Decision Systems: Faculty votes on curriculum changes, policy
approvals, and resource allocation — providing a transparent, tamper-proof
record of institutional decisions.
```

## `3.8 Research Contribution` 

`1. First FYP-level integration of AI-based behavioral anomaly detection with a privacy-preserving blockchain voting architecture.` 

`2. Practical demonstration of ZKP conceptual application in an organizational voting context.` 

`3. Complete end-to-end implementation of a ten-stage voting data flow pipeline on a private Ethereum chain.` 

`4. Open-source smart contract design with documented security patterns` 

- `(reentrancy protection, overflow safety) applicable to future voting system research.` 

`5. Empirical evaluation metrics establishing benchmarks for blockchain voting system performance at organizational scale.` 

## `3.9 Legal and Ethical Considerations` 

```
Pakistan Legal Context: System does not integrate with NADRA or any government
database. All voter data stored locally and encrypted. Explicitly scoped to
organizational/university use — does not claim compliance with Election Act
2017.
```

```
Data Privacy: CNIC stored only as SHA-256 hash — original CNIC never persisted.
Blockchain records contain only encrypted votes and wallet addresses. Voter
metadata processed by AI module is anonymized prior to analysis.
```

```
AI Ethics: AI module is a flagging tool only — not a decision-making authority.
All alerts require human review. No voter deanonymization possible from AI
outputs by design. Model bias mitigated by using behavioral metadata only — no
demographic profiling.
```

## `3.10 Risk Management` 

```
Blockchain Node Failure: Mitigation: Ganache configured with persistent state
snapshots; automatic restart scripts; election state backed up to local JSON
before and after each transaction.
```

```
Smart Contract Vulnerability: Mitigation: OpenZeppelin security patterns
applied; Slither static analysis tool used pre-deployment; test coverage target
```

```
> 90%.
```

```
Identity Breach: Mitigation: CNIC stored as irreversible SHA-256 hash only; OTP
5-minute expiry; account lockout after 3 failed authentication attempts.
AI False Positives: Mitigation: Anomaly threshold tuned to maintain < 5% false
positive rate; all flags require manual admin confirmation before any action.
Timeline Slippage: Mitigation: Gantt chart with explicit dependencies and
milestones; weekly supervisor check-ins; buffer weeks built into each phase.
Team Member Unavailability: Mitigation: Cross-training on all modules; shared
codebase on GitHub with branch protection; detailed documentation maintained
throughout.
```

