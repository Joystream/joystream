import { useContext } from 'react';
import { TransportContext } from '../context';

export default function useTransport () {
  return useContext(TransportContext);
}
