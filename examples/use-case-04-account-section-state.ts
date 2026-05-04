import { useState } from "react";

export function useAccountSectionState() {
  const [isExpanded, setIsExpanded] = useState(false);

  return {
    isExpanded,
    toggle: () => setIsExpanded((value) => !value),
  };
}
