import { useState, useEffect } from 'react';
import { useTransport } from '../';
import { ProposalId } from '@joystream/types/proposals';
import { ParsedProposal } from '@polkadot/joy-utils/types/proposals';

// Take advantage of polkadot api subscriptions to re-fetch proposal data and votes
// each time there is some runtime change in the proposal
const useProposalSubscription = (id: ProposalId) => {
  const transport = useTransport();
  // State holding current proposal data
  const [data, setData] = useState<ParsedProposal | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // onMount...
    let unmounted = false;
    let unsubscribeProposal: (() => void) | undefined;
    const refreshProposalData = () => {
      transport.proposals.proposalById(id)
        .then(newData => {
          if (!unmounted) {
            setData(newData);
            setLoading(false);
          }
        })
        .catch(error => {
          if (!unmounted) {
            setError(error);
            setLoading(false);
          }
        });
    };
    // Create the subscription
    transport.proposals.subscribeProposal(id, refreshProposalData)
      .then(unsubscribe => {
        if (!unmounted) {
          unsubscribeProposal = unsubscribe;
        } else {
          unsubscribe(); // If already unmounted - unsubscribe immedietally!
        }
      });
    return () => {
      // onUnmount...
      // Clean the subscription
      unmounted = true;
      if (unsubscribeProposal) {
        unsubscribeProposal();
      }
    };
  }, []);

  return { data, error, loading };
};

export default useProposalSubscription;
