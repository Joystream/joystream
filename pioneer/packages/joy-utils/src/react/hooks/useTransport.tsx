import { useContext } from 'react';
import Transport from "../../transport";
import { TransportContext } from "../context";

export default function useTransport() {
  return useContext(TransportContext) as Transport;
}
