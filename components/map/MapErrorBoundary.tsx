"use client";

import { Component, type ReactNode } from "react";
import { MapPinned } from "lucide-react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // Map errors are isolated so the rest of the dashboard remains usable.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid h-full min-h-[320px] place-items-center rounded-md border border-border bg-white p-6 text-center">
          <div>
            <MapPinned className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">Map unavailable</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              The location list remains available while the map renderer recovers.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
