import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
          <div className="max-w-md text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                An unexpected error occurred. Please refresh the page or go back to the homepage.
              </p>
              {this.state.error && (
                <p className="mt-3 text-xs font-mono text-muted-foreground/60 bg-muted rounded-lg px-3 py-2 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Refresh page
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
