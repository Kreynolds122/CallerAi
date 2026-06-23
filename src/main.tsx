
  import { Component, type ReactNode } from "react";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  class RootErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
    state = { error: null };

    static getDerivedStateFromError(error: Error) {
      return { error: error.message };
    }

    componentDidCatch(error: Error) {
      console.error(error);
    }

    render() {
      if (this.state.error) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-border w-full max-w-md">
              <h1 className="text-xl font-bold text-foreground mb-2">Recovery Group</h1>
              <p className="text-sm text-muted-foreground mb-4">The app hit a startup error before the dashboard could load.</p>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap break-words">
                {this.state.error}
              </div>
            </div>
          </div>
        );
      }

      return this.props.children;
    }
  }

  createRoot(document.getElementById("root")!).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
  