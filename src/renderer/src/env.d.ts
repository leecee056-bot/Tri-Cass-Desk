import type { DeskApi } from '../../shared/ipc'

declare global {
  interface Window {
    desk: DeskApi
  }
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          allowpopups?: string | boolean
        },
        HTMLElement
      >
    }
  }
}

export {}
