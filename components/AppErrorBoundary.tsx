import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 24,
            maxWidth: 560,
            margin: "48px auto",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>App error</h1>
          <pre
            style={{
              fontSize: 13,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 8,
            }}
          >
            {this.state.message}
          </pre>
          <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.5 }}>
            Stop the dev server, run <code>rm -rf .next</code>, then{" "}
            <code>npm run dev</code> and open the exact URL shown (watch the
            port).
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
