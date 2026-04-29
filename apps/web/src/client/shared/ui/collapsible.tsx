"use client";

import { AnimatePresence, motion } from "motion/react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
} from "react";

/* Radix's Collapsible.Content unmounts when closed, which makes it tricky to
 * orchestrate exit animations. We track open state in our own context (kept
 * in sync with Radix Root) and replace Content with motion + AnimatePresence
 * so both enter and exit are animated.
 *
 * Radix Root + Trigger are kept for accessibility (aria-expanded, keyboard).
 * Animation timings follow the project design guide (Rule 3): ~200ms,
 * Material standard easing. MotionConfig at the app layer handles
 * prefers-reduced-motion. */

const OpenContext = createContext<boolean>(false);

const STANDARD_EASE = [0.3, 0.05, 0.45, 1] as const;
const STANDARD_DURATION = 0.2;

function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.Root>) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  return (
    <OpenContext.Provider value={open}>
      <CollapsiblePrimitive.Root
        data-slot="collapsible"
        open={open}
        onOpenChange={(next) => {
          if (!isControlled) setInternalOpen(next);
          onOpenChange?.(next);
        }}
        {...props}
      >
        {children}
      </CollapsiblePrimitive.Root>
    </OpenContext.Provider>
  );
}

function CollapsibleTrigger({
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
}

function CollapsibleContent({
  children,
  className,
  ...props
}: ComponentProps<typeof motion.div>) {
  const open = useContext(OpenContext);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="collapsible-content"
          data-slot="collapsible-content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            duration: STANDARD_DURATION,
            ease: STANDARD_EASE,
          }}
          style={{ overflow: "hidden" }}
          className={className}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
