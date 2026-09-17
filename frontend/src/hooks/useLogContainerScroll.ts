import { useLayoutEffect, useRef, type RefObject, type UIEvent } from "react";

const NEAR_BOTTOM_PX = 64;

/**
 * Keep a log console pinned to the latest line without scrolling the page.
 * Follows new lines while the user has not scrolled up to read older output.
 */
export function useLogContainerScroll(
  containerRef: RefObject<HTMLElement | null>,
  logCount: number,
  resetKey?: string | null,
) {
  const stickToBottomRef = useRef(true);
  const skipScrollHandlerRef = useRef(false);

  useLayoutEffect(() => {
    stickToBottomRef.current = true;
  }, [resetKey]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !stickToBottomRef.current) {
      return;
    }
    skipScrollHandlerRef.current = true;
    el.scrollTop = el.scrollHeight;
    queueMicrotask(() => {
      skipScrollHandlerRef.current = false;
    });
  }, [containerRef, logCount, resetKey]);

  const onScroll = (event: UIEvent<HTMLElement>) => {
    if (skipScrollHandlerRef.current) {
      return;
    }
    const el = event.currentTarget;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
  };

  return { onScroll };
}
