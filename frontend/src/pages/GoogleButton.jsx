import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleButton({ onCredential }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let stopped = false;

    const init = () => {
      if (!window.google || stopped) return false;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => onCredential(resp.credential),
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 300,
      });
      return true;
    };

    // The Google script loads asynchronously, so retry until it's ready
    let timer;
    if (!init()) {
      timer = setInterval(() => { if (init()) clearInterval(timer); }, 200);
    }
    return () => { stopped = true; clearInterval(timer); };
  }, []);

  if (!CLIENT_ID) return null;
  return <div ref={ref} className="googlebtn" />;
}
