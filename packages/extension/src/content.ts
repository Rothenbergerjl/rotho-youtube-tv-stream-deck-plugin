// Content script on tv.youtube.com: reports the program title to the service worker whenever
// it changes.
import { extractPageTitle } from "./page-title";
import { startTitleReporter } from "./report-title";

startTitleReporter(() => extractPageTitle(document, navigator.mediaSession?.metadata?.title));
