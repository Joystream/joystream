import React from "react";
import "../index.css";
import { SignalForm, EvictStorageProviderForm, SpendingProposalForm, MintCapacityForm } from "../forms";

export default {
  title: "Proposals | Forms"
};

export const Signal = () => <SignalForm />;

export const StorageProviders = () => <EvictStorageProviderForm storageProviders={storageProvidersData} />;

export const SpendingProposal = () => <SpendingProposalForm destinationAccounts={destinationAccounts} />;

export const MintCapacity = () => <MintCapacityForm />;

var storageProvidersData = [
  {
    key: "Jenny Hess",
    text: "Jenny Hess",
    value: "Jenny Hess",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/jenny.jpg" }
  },
  {
    key: "Elliot Fu",
    text: "Elliot Fu",
    value: "Elliot Fu",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/elliot.jpg" }
  },
  {
    key: "Stevie Feliciano",
    text: "Stevie Feliciano",
    value: "Stevie Feliciano",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/stevie.jpg" }
  },
  {
    key: "Christian",
    text: "Christian",
    value: "Christian",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/christian.jpg" }
  },
  {
    key: "Matt",
    text: "Matt",
    value: "Matt",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/elliot.jpg" }
  },
  {
    key: "Justen Kitsune",
    text: "Justen Kitsune",
    value: "Justen Kitsune",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/steve.jpg" }
  }
];

const destinationAccounts = [
  {
    key: "Jenny Hess",
    text: "Jenny Hess",
    value: "0x555",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/jenny.jpg" }
  },
  {
    key: "Elliot Fu",
    text: "Elliot Fu",
    value: "0x555",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/elliot.jpg" }
  },
  {
    key: "Stevie Feliciano",
    text: "Stevie Feliciano",
    value: "0x555",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/stevie.jpg" }
  },
  {
    key: "Christian",
    text: "Christian",
    value: "0x555",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/christian.jpg" }
  },
  {
    key: "Matt",
    text: "Matt",
    value: "0x555",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/elliot.jpg" }
  },
  {
    key: "Justen Kitsune",
    text: "Justen Kitsune",
    value: "0x555",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/steve.jpg" }
  }
];
