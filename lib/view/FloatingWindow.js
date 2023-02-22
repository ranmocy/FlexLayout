"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloatingWindow = void 0;
const React = require("react");
const react_dom_1 = require("react-dom");
const Types_1 = require("../Types");
/** @internal */
const FloatingWindow = (props) => {
    const { title, id, url, rect, onCloseWindow, onSetWindow, children } = props;
    const popoutWindow = React.useRef(null);
    const timerId = React.useRef(null);
    const [content, setContent] = React.useState(undefined);
    React.useLayoutEffect(() => {
        if (timerId.current) {
            clearTimeout(timerId.current);
        }
        const r = rect;
        // Make a local copy of the styles from the current window which will be passed into
        // the floating window. window.document.styleSheets is mutable and we can't guarantee
        // the styles will exist when 'popoutWindow.load' is called below.
        const styles = Array.from(window.document.styleSheets).reduce((result, styleSheet) => {
            let rules = undefined;
            try {
                rules = styleSheet.cssRules;
            }
            catch (e) {
                // styleSheet.cssRules can throw security exception
            }
            try {
                return [
                    ...result,
                    {
                        href: styleSheet.href,
                        type: styleSheet.type,
                        rules: rules ? Array.from(rules).map(rule => rule.cssText) : null,
                    }
                ];
            }
            catch (e) {
                return result;
            }
        }, []);
        popoutWindow.current = window.open(url, id, `left=${r.x},top=${r.y},width=${r.width},height=${r.height}`);
        if (popoutWindow.current !== null) {
            onSetWindow(id, popoutWindow.current);
            // listen for parent unloading to remove all popouts
            window.addEventListener("beforeunload", () => {
                if (popoutWindow.current) {
                    popoutWindow.current.close();
                    popoutWindow.current = null;
                }
            });
            popoutWindow.current.addEventListener("load", () => {
                const popoutDocument = popoutWindow.current.document;
                popoutDocument.title = title;
                const popoutContent = popoutDocument.createElement("div");
                popoutContent.className = Types_1.CLASSES.FLEXLAYOUT__FLOATING_WINDOW_CONTENT;
                popoutDocument.body.appendChild(popoutContent);
                copyStyles(popoutDocument, styles).then(() => {
                    setContent(popoutContent);
                });
                // listen for popout unloading (needs to be after load for safari)
                popoutWindow.current.addEventListener("beforeunload", () => {
                    onCloseWindow(id);
                });
            });
        }
        else {
            console.warn(`Unable to open window ${url}`);
            onCloseWindow(id);
        }
        return () => {
            // delay so refresh will close window
            timerId.current = setTimeout(() => {
                if (popoutWindow.current) {
                    popoutWindow.current.close();
                    popoutWindow.current = null;
                }
            }, 0);
        };
    }, []);
    if (content !== undefined) {
        return (0, react_dom_1.createPortal)(children, content);
    }
    else {
        return null;
    }
};
exports.FloatingWindow = FloatingWindow;
/** @internal */
function copyStyles(doc, styleSheets) {
    const head = doc.head;
    const promises = [];
    for (const styleSheet of styleSheets) {
        if (styleSheet.href) {
            // prefer links since they will keep paths to images etc
            const styleElement = doc.createElement("link");
            styleElement.type = styleSheet.type;
            styleElement.rel = "stylesheet";
            styleElement.href = styleSheet.href;
            head.appendChild(styleElement);
            promises.push(new Promise((resolve, reject) => {
                styleElement.onload = () => resolve(true);
            }));
        }
        else {
            if (styleSheet.rules) {
                const style = doc.createElement("style");
                for (const rule of styleSheet.rules) {
                    style.appendChild(doc.createTextNode(rule));
                }
                head.appendChild(style);
            }
        }
    }
    return Promise.all(promises);
}
//# sourceMappingURL=FloatingWindow.js.map