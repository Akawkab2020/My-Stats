import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }} dir="rtl">
          <div className="neu-card p-10 text-center" style={{ maxWidth: '400px' }}>
            <div className="text-4xl mb-4" style={{ color: 'var(--color-danger)' }}>⚠</div>
            <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>حدث خطأ غير متوقع</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="neu-btn-primary"
              style={{ maxWidth: '200px', margin: '0 auto' }}
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { GlobalAppProvider } from './context/GlobalAppContext';

function App() {
  return (
    <ErrorBoundary>
      <GlobalAppProvider>
        <RouterProvider router={router} />
      </GlobalAppProvider>
    </ErrorBoundary>
  );
}

export default App;