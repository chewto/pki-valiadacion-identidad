import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Algo no salió como esperábamos
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Ocurrió un problema temporal al cargar los recursos de validación. Por favor, intenta recargar la página.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors shadow-sm"
              >
                Recargar página
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm py-2 px-4 rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
