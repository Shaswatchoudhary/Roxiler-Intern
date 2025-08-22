import * as React from "react";

const MOBILE_BREAKPOINT = 768; //MOBILE_BREAKPOINT is the breakpoint for mobile devices

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);//mql is the media query list
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);//setIsMobile is a function that sets the state of isMobile
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
