import Wrapper from "components/Wrapper";
import { useProvider } from "wagmi";
import MonoLabel from "./MonoLabel";
import { useState } from "react";

const Provider = () => {
  const [ready, setReady] = useState(false);
  const provider = useProvider();

  provider.ready.then(() => {
    setReady(true);
  });

  if (!ready) {
    return (
      <Wrapper title="useProvider">
        <p>
          Provider loaded: <MonoLabel label={"pending"} />
        </p>
      </Wrapper>
    );
  } else {
    return (
      <Wrapper title="useProvider">
        <p>
          Provider loaded: <MonoLabel label={"success"} />
        </p>
      </Wrapper>
    );
  }
};

export default Provider;