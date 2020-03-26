import React from "react";

import { Button } from "../src/";

export default {
  title: "Button",
  component: Button,
};

export const Default = () => (
  <div style={{ display: "flex" }}>
    <div style={{ margin: 20 }}>
      <Button size="small">Hello Atlas</Button>
    </div>
    <div style={{ margin: 20 }}>
      <Button>Hello Atlas</Button>
    </div>
    <div style={{ margin: 20 }}>
      <Button size="large">Hello Atlas</Button>
    </div>
  </div>
);

export const Danger = () => (
  <div style={{ display: "flex" }}>
    <div style={{ margin: 20 }}>
      <Button size="small" color="danger">
        Hello Atlas
      </Button>
    </div>
    <div style={{ margin: 20 }}>
      <Button color="danger">Hello Atlas</Button>
    </div>
    <div style={{ margin: 20 }}>
      <Button size="large" color="danger">
        Hello Atlas
      </Button>
    </div>
  </div>
);
export const Neutral = () => (
  <div style={{ display: "flex" }}>
    <div style={{ margin: 20 }}>
      <Button color="neutral" size="small">
        Hello Atlas
      </Button>
    </div>
    <div style={{ margin: 20 }}>
      <Button color="neutral">Hello Atlas</Button>
    </div>
    <div style={{ margin: 20 }}>
      <Button color="neutral" size="large">
        Hello Atlas
      </Button>
    </div>
  </div>
);

export const Success = () => (
  <div style={{ display: "flex" }}>
    <div style={{ margin: 20 }}>
      <Button size="small" color="success">
        Hello Atlas
      </Button>
    </div>
    <div style={{ margin: 20 }}>
      <Button color="success">Hello Atlas</Button>
    </div>
    <div style={{ margin: 20 }}>
      <Button size="large" color="success">
        Hello Atlas
      </Button>
    </div>
  </div>
);
