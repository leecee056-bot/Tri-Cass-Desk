import BrowserSurface from '../surfaces/BrowserSurface'

/** Legacy alias — dock Browser uses BrowserSurface via AppHost; keep for tools. */
export default function BrowseView(): React.JSX.Element {
  return <BrowserSurface title="Browser" />
}
