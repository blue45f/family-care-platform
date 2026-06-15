import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

/**
 * 앱 최상위 에러 바운더리. 렌더 중 throw 되는 예외를 잡아 빈 화면 대신
 * 복구 가능한 폴백 UI를 보여준다(다시 시도 / 홈 이동). 에러 바운더리는
 * 클래스 컴포넌트로만 구현할 수 있어 여기만 예외적으로 클래스를 쓴다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 운영에서는 모니터링으로 전송할 지점. 지금은 콘솔로 남겨 디버깅을 돕는다.
    console.error('Unhandled render error:', error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
  }

  private handleGoHome = (): void => {
    if (typeof window !== 'undefined') {
      globalThis.location.assign('/')
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="grid min-h-dvh place-items-center bg-bg-app p-4" role="alert">
          <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-5 text-center shadow-sm md:p-6">
            <h1 className="text-lg font-semibold text-fg-strong">화면을 표시하지 못했습니다</h1>
            <p className="text-fg-muted">
              예상치 못한 오류가 발생했습니다. 다시 시도하거나 홈으로 이동해 주세요.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className="btn btn-primary" onClick={this.handleReset}>
                다시 시도
              </button>
              <button type="button" className="btn btn-ghost" onClick={this.handleGoHome}>
                홈으로
              </button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
