// Firestore Security Rules for Vote Ledger
// These rules should be deployed to your Firebase project

export const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && 
        request.auth.uid == userId &&
        validateUserData(request.resource.data);
    }
    
    // Candidates collection - read-only for authenticated users
    match /candidates/{candidateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        isAdmin(request.auth.uid);
    }
    
    // Elections collection - read-only for authenticated users
    match /elections/{electionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        isAdmin(request.auth.uid);
    }
    
    // Votes collection - users can only create their own votes
    match /votes/{voteId} {
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.voterId &&
        !hasUserVoted(request.auth.uid, resource.data.electionId) &&
        validateVoteData(request.resource.data);
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.voterId || isAdmin(request.auth.uid));
      allow update, delete: if false; // Votes are immutable once cast
    }
    
    // Vote counts collection - read-only for authenticated users
    match /voteCounts/{electionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        isAdmin(request.auth.uid);
    }
    
    // Helper functions
    function validateUserData(data) {
      return data.keys().hasAll(['name', 'cnic', 'email', 'isAdmin']) &&
        data.name is string &&
        data.cnic is string &&
        data.email is string &&
        data.isAdmin is bool;
    }
    
    function validateVoteData(data) {
      return data.keys().hasAll(['voterId', 'candidateId', 'electionId', 'timestamp']) &&
        data.voterId is string &&
        data.candidateId is string &&
        data.electionId is string &&
        data.timestamp is timestamp;
    }
    
    function isAdmin(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.isAdmin == true;
    }
    
    function hasUserVoted(userId, electionId) {
      return exists(/databases/$(database)/documents/votes/$(userId + '_' + electionId));
    }
  }
}
`;

// Storage Rules for Vote Ledger
export const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures
    match /profile-pictures/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Candidate images
    match /candidates/{candidateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // Election documents
    match /elections/{electionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    function isAdmin(userId) {
      return firestore.get(/databases/(default)/documents/users/$(userId)).data.isAdmin == true;
    }
  }
}
`;

