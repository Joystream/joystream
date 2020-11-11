import { useContext } from 'react';
import { MyMembershipContext } from '../context';

export default function useMyMembership () {
  return useContext(MyMembershipContext);
}
