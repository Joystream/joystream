import React from "react";
import { Block } from "components";

const blockData = {
  blockNum: 1854,
  hash: "0x080d672d268a72cae5b255918c1c832439869d6b9b36933734612ba7cd53f2db",

  parentHash:
    "0xdfe6522b146213accfb65c16ba82ad96e0cc737abe21eb28bbea80135e08e2d4",

  stateRoot:
    "0xb0486392387dc820afb96ecd3b0d8f129538b789d811d0e82d86607d45424664",

  extrinsictRoot:
    "0x3f4378235b086fd65dd5d3650c8ef82e1b75297e884389ad1037fcc966a9ae05",
};

export default function App() {
<<<<<<< HEAD
<<<<<<< HEAD
  return <h1>Hello Atlas</h1>;
=======
  return <div>Hello Atlas</div>;
>>>>>>> develop
=======
  return (
    <div>
      Hello Atlas
      <Block {...blockData}></Block>
    </div>
  );
>>>>>>> develop
}
