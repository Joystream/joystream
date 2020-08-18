import { useState, useEffect } from 'react';
import { ParsedProposal, ProposalVotes } from '../../../types/proposals';
import { useTransport, usePromise } from '../';
import { ProposalId } from '@joystream/types/proposals';

// Take advantage of polkadot api subscriptions to re-fetch proposal data and votes
// each time there is some runtime change in the proposal
const useProposalSubscription = (id: ProposalId) => {
  const transport = useTransport();
  // State holding an "unsubscribe method"
  const [unsubscribeProposal, setUnsubscribeProposal] = useState<(() => void) | null>(null);

  const [proposal, proposalError, proposalLoading, refreshProposal] = usePromise<ParsedProposal>(
    () => transport.proposals.proposalById(id),
    {} as ParsedProposal
  );

  const [votes, votesError, votesLoading, refreshVotes] = usePromise<ProposalVotes | null>(
    () => transport.proposals.votes(id),
    null
  );

  // Function to re-fetch the data using transport
  const refreshProposalData = () => {
    refreshProposal();
    refreshVotes();
  };

  useEffect(() => {
    // onMount...
    let unmounted = false;
    // Create the subscription
    transport.proposals.subscribeProposal(id, refreshProposalData)
      .then(unsubscribe => {
        if (!unmounted) {
          setUnsubscribeProposal(() => unsubscribe);
        } else {
          unsubscribe(); // If already unmounted - unsubscribe immedietally!
        }
      });
    return () => {
      // onUnmount...
      // Clean the subscription
      unmounted = true;
      if (unsubscribeProposal !== null) unsubscribeProposal();
    };
  }, []);

  return {
    proposal: { data: proposal, error: proposalError, loading: proposalLoading },
    votes: { data: votes, error: votesError, loading: votesLoading }
  };
};

export default useProposalSubscription;
