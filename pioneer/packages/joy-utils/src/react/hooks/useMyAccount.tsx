import { useContext } from 'react'
import { MyAccountContext } from '../context/account'

export default function useMyAccount () {
  return useContext(MyAccountContext);
}
