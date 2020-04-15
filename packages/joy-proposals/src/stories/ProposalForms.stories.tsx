import React from "react";
import "../index.css";
import { SignalForm, EvictStorageProviderForm } from "../forms/";

export default {
  title: "Proposals | Forms"
};

const storageProvidersData = [
  {
    key: "Jenny Hess",
    text: "Jenny Hess",
    value: "Jenny Hess",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/large/jenny.jpg" }
  },
  {
    key: "Elliot Fu",
    text: "Elliot Fu",
    value: "Elliot Fu",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/large/elliot.jpg" }
  },
  {
    key: "Stevie Feliciano",
    text: "Stevie Feliciano",
    value: "Stevie Feliciano",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/large/stevie.jpg" }
  },
  {
    key: "Christian",
    text: "Christian",
    value: "Christian",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/large/christian.jpg" }
  },
  {
    key: "Matt",
    text: "Matt",
    value: "Matt",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/large/elliot.jpg" }
  },
  {
    key: "Justen Kitsune",
    text: "Justen Kitsune",
    value: "Justen Kitsune",
    image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/large/steve.jpg" }
  }
];

export const Signal = () => <SignalForm />;

export const StorageProviders = () => <EvictStorageProviderForm storageProviders={storageProvidersData} />;
