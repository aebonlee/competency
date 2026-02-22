import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary, #f5f5f5)',
        }}>
          <div style={{
            background: 'var(--bg-primary, #fff)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '48px 40px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary, #333)',
              marginBottom: '16px',
            }}>
              오류가 발생했습니다
            </h1>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-light, #888)',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}>
              예기치 않은 오류가 발생했습니다.<br />
              잠시 후 다시 시도하거나, 홈으로 돌아가주세요.
            </p>
            <button
              onClick={this.handleGoHome}
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
