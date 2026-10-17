// Content script on Paramount+ live pages (registered only while Paramount+ is turned on):
// reports `<program> (<channel>)` to the service worker whenever it changes.
import { extractParamountTitle } from "./paramount-title";
import { startTitleReporter } from "./report-title";

startTitleReporter(() => extractParamountTitle(document, location.pathname));
