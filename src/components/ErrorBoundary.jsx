import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("App Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6">
          <div className="max-w-xl w-full bg-white p-8 rounded-[2.5rem] shadow-2xl border border-red-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Encountered an Error</h1>
            <p className="text-sm font-medium text-slate-500">
              An unexpected issue occurred while rendering the interface.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 p-4 rounded-xl text-left overflow-x-auto text-xs text-red-600 font-mono border border-slate-200">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
