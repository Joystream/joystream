import { useContext } from 'react';
import Transport from "../../transport/index";
import { TransportContext } from "../context";

export default function useTransport() {
  return useContext(TransportContext) as Transport;
}
