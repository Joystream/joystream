import Block from "./components/Block";

import { blockData } from "../stories/1-Block.stories";

export default function App() {
  return (
    <div>
      <div>Here is a simple block information</div>
      <Block {...blockData}></Block>
    </div>
  );
}
