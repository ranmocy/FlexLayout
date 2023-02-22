"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabSet = void 0;
const React = require("react");
const I18nLabel_1 = require("../I18nLabel");
const Actions_1 = require("../model/Actions");
const PopupMenu_1 = require("../PopupMenu");
const TabButton_1 = require("./TabButton");
const TabOverflowHook_1 = require("./TabOverflowHook");
const Orientation_1 = require("../Orientation");
const Types_1 = require("../Types");
const Utils_1 = require("./Utils");
/** @internal */
const TabSet = (props) => {
    const { node, layout, iconFactory, titleFactory, icons, path } = props;
    const toolbarRef = React.useRef(null);
    const overflowbuttonRef = React.useRef(null);
    const tabbarInnerRef = React.useRef(null);
    const stickyButtonsRef = React.useRef(null);
    const { selfRef, position, userControlledLeft, hiddenTabs, onMouseWheel, tabsTruncated } = (0, TabOverflowHook_1.useTabOverflow)(node, Orientation_1.Orientation.HORZ, toolbarRef, stickyButtonsRef);
    const onOverflowClick = (event) => {
        const callback = layout.getShowOverflowMenu();
        if (callback !== undefined) {
            callback(node, event, hiddenTabs, onOverflowItemSelect);
        }
        else {
            const element = overflowbuttonRef.current;
            (0, PopupMenu_1.showPopup)(element, hiddenTabs, onOverflowItemSelect, layout, iconFactory, titleFactory);
        }
        event.stopPropagation();
    };
    const onOverflowItemSelect = (item) => {
        layout.doAction(Actions_1.Actions.selectTab(item.node.getId()));
        userControlledLeft.current = false;
    };
    const onMouseDown = (event) => {
        if (!(0, Utils_1.isAuxMouseEvent)(event)) {
            let name = node.getName();
            if (name === undefined) {
                name = "";
            }
            else {
                name = ": " + name;
            }
            layout.doAction(Actions_1.Actions.setActiveTabset(node.getId()));
            if (!layout.getEditingTab()) {
                const message = layout.i18nName(I18nLabel_1.I18nLabel.Move_Tabset, name);
                if (node.getModel().getMaximizedTabset() !== undefined) {
                    layout.dragStart(event, message, node, false, (event2) => undefined, onDoubleClick);
                }
                else {
                    layout.dragStart(event, message, node, node.isEnableDrag(), (event2) => undefined, onDoubleClick);
                }
            }
        }
    };
    const onAuxMouseClick = (event) => {
        if ((0, Utils_1.isAuxMouseEvent)(event)) {
            layout.auxMouseClick(node, event);
        }
    };
    const onContextMenu = (event) => {
        layout.showContextMenu(node, event);
    };
    const onInterceptMouseDown = (event) => {
        event.stopPropagation();
    };
    const onMaximizeToggle = (event) => {
        if (node.canMaximize()) {
            layout.maximize(node);
        }
        event.stopPropagation();
    };
    const onClose = (event) => {
        layout.doAction(Actions_1.Actions.deleteTabset(node.getId()));
        event.stopPropagation();
    };
    const onFloatTab = (event) => {
        if (selectedTabNode !== undefined) {
            layout.doAction(Actions_1.Actions.floatTab(selectedTabNode.getId()));
        }
        event.stopPropagation();
    };
    const onDoubleClick = (event) => {
        if (node.canMaximize()) {
            layout.maximize(node);
        }
    };
    // Start Render
    const cm = layout.getClassName;
    // tabbar inner can get shifted left via tab rename, this resets scrollleft to 0
    if (tabbarInnerRef.current !== null && tabbarInnerRef.current.scrollLeft !== 0) {
        tabbarInnerRef.current.scrollLeft = 0;
    }
    const selectedTabNode = node.getSelectedNode();
    let style = node._styleWithPosition();
    if (node.getModel().getMaximizedTabset() !== undefined && !node.isMaximized()) {
        (0, Utils_1.hideElement)(style, node.getModel().isUseVisibility());
    }
    const tabs = [];
    if (node.isEnableTabStrip()) {
        for (let i = 0; i < node.getChildren().length; i++) {
            const child = node.getChildren()[i];
            let isSelected = node.getSelected() === i;
            tabs.push(React.createElement(TabButton_1.TabButton, { layout: layout, node: child, path: path + "/tb" + i, key: child.getId(), selected: isSelected, iconFactory: iconFactory, titleFactory: titleFactory, icons: icons }));
            if (i < node.getChildren().length - 1) {
                tabs.push(React.createElement("div", { key: "divider" + i, className: cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_TAB_DIVIDER) }));
            }
        }
    }
    const showHeader = node.getName() !== undefined;
    let stickyButtons = [];
    let buttons = [];
    let headerButtons = [];
    // allow customization of header contents and buttons
    const renderState = { headerContent: node.getName(), stickyButtons, buttons, headerButtons };
    layout.customizeTabSet(node, renderState);
    const headerContent = renderState.headerContent;
    stickyButtons = renderState.stickyButtons;
    buttons = renderState.buttons;
    headerButtons = renderState.headerButtons;
    if (stickyButtons.length > 0) {
        if (tabsTruncated) {
            buttons = [...stickyButtons, ...buttons];
        }
        else {
            tabs.push(React.createElement("div", { ref: stickyButtonsRef, key: "sticky_buttons_container", onMouseDown: onInterceptMouseDown, onTouchStart: onInterceptMouseDown, onDragStart: (e) => { e.preventDefault(); }, className: cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR_STICKY_BUTTONS_CONTAINER) }, stickyButtons));
        }
    }
    let toolbar;
    if (hiddenTabs.length > 0) {
        const overflowTitle = layout.i18nName(I18nLabel_1.I18nLabel.Overflow_Menu_Tooltip);
        let overflowContent;
        if (typeof icons.more === "function") {
            overflowContent = icons.more(node, hiddenTabs);
        }
        else {
            overflowContent = (React.createElement(React.Fragment, null,
                icons.more,
                React.createElement("div", { className: cm(Types_1.CLASSES.FLEXLAYOUT__TAB_BUTTON_OVERFLOW_COUNT) }, hiddenTabs.length)));
        }
        buttons.push(React.createElement("button", { key: "overflowbutton", "data-layout-path": path + "/button/overflow", ref: overflowbuttonRef, className: cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(Types_1.CLASSES.FLEXLAYOUT__TAB_BUTTON_OVERFLOW), title: overflowTitle, onClick: onOverflowClick, onMouseDown: onInterceptMouseDown, onTouchStart: onInterceptMouseDown }, overflowContent));
    }
    if (selectedTabNode !== undefined && layout.isSupportsPopout() && selectedTabNode.isEnableFloat() && !selectedTabNode.isFloating()) {
        const floatTitle = layout.i18nName(I18nLabel_1.I18nLabel.Float_Tab);
        buttons.push(React.createElement("button", { key: "float", "data-layout-path": path + "/button/float", title: floatTitle, className: cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON_FLOAT), onClick: onFloatTab, onMouseDown: onInterceptMouseDown, onTouchStart: onInterceptMouseDown }, (typeof icons.popout === "function") ? icons.popout(selectedTabNode) : icons.popout));
    }
    if (node.canMaximize()) {
        const minTitle = layout.i18nName(I18nLabel_1.I18nLabel.Restore);
        const maxTitle = layout.i18nName(I18nLabel_1.I18nLabel.Maximize);
        const btns = showHeader ? headerButtons : buttons;
        btns.push(React.createElement("button", { key: "max", "data-layout-path": path + "/button/max", title: node.isMaximized() ? minTitle : maxTitle, className: cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON_ + (node.isMaximized() ? "max" : "min")), onClick: onMaximizeToggle, onMouseDown: onInterceptMouseDown, onTouchStart: onInterceptMouseDown }, node.isMaximized() ?
            (typeof icons.restore === "function") ? icons.restore(node) : icons.restore :
            (typeof icons.maximize === "function") ? icons.maximize(node) : icons.maximize));
    }
    if (!node.isMaximized() && node.isEnableClose()) {
        const title = layout.i18nName(I18nLabel_1.I18nLabel.Close_Tabset);
        const btns = showHeader ? headerButtons : buttons;
        btns.push(React.createElement("button", { key: "close", "data-layout-path": path + "/button/close", title: title, className: cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON_CLOSE), onClick: onClose, onMouseDown: onInterceptMouseDown, onTouchStart: onInterceptMouseDown }, (typeof icons.closeTabset === "function") ? icons.closeTabset(node) : icons.closeTabset));
    }
    toolbar = (React.createElement("div", { key: "toolbar", ref: toolbarRef, className: cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR), onMouseDown: onInterceptMouseDown, onTouchStart: onInterceptMouseDown, onDragStart: (e) => { e.preventDefault(); } }, buttons));
    let header;
    let tabStrip;
    let tabStripClasses = cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_TABBAR_OUTER);
    if (node.getClassNameTabStrip() !== undefined) {
        tabStripClasses += " " + node.getClassNameTabStrip();
    }
    tabStripClasses += " " + Types_1.CLASSES.FLEXLAYOUT__TABSET_TABBAR_OUTER_ + node.getTabLocation();
    if (node.isActive() && !showHeader) {
        tabStripClasses += " " + cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_SELECTED);
    }
    if (node.isMaximized() && !showHeader) {
        tabStripClasses += " " + cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_MAXIMIZED);
    }
    if (showHeader) {
        const headerToolbar = (React.createElement("div", { key: "toolbar", ref: toolbarRef, className: cm(Types_1.CLASSES.FLEXLAYOUT__TAB_TOOLBAR), onMouseDown: onInterceptMouseDown, onTouchStart: onInterceptMouseDown, onDragStart: (e) => { e.preventDefault(); } }, headerButtons));
        let tabHeaderClasses = cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_HEADER);
        if (node.isActive()) {
            tabHeaderClasses += " " + cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_SELECTED);
        }
        if (node.isMaximized()) {
            tabHeaderClasses += " " + cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_MAXIMIZED);
        }
        if (node.getClassNameHeader() !== undefined) {
            tabHeaderClasses += " " + node.getClassNameHeader();
        }
        header = (React.createElement("div", { className: tabHeaderClasses, style: { height: node.getHeaderHeight() + "px" }, "data-layout-path": path + "/header", onMouseDown: onMouseDown, onContextMenu: onContextMenu, onClick: onAuxMouseClick, onAuxClick: onAuxMouseClick, onTouchStart: onMouseDown },
            React.createElement("div", { className: cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_HEADER_CONTENT) }, headerContent),
            headerToolbar));
    }
    const tabStripStyle = { height: node.getTabStripHeight() + "px" };
    tabStrip = (React.createElement("div", { className: tabStripClasses, style: tabStripStyle, "data-layout-path": path + "/tabstrip", onMouseDown: onMouseDown, onContextMenu: onContextMenu, onClick: onAuxMouseClick, onAuxClick: onAuxMouseClick, onTouchStart: onMouseDown },
        React.createElement("div", { ref: tabbarInnerRef, className: cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_TABBAR_INNER) + " " + cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_TABBAR_INNER_ + node.getTabLocation()) },
            React.createElement("div", { style: { left: position }, className: cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_TABBAR_INNER_TAB_CONTAINER) + " " + cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_TABBAR_INNER_TAB_CONTAINER_ + node.getTabLocation()) }, tabs)),
        toolbar));
    style = layout.styleFont(style);
    var placeHolder = undefined;
    if (node.getChildren().length === 0) {
        const placeHolderCallback = layout.getTabSetPlaceHolderCallback();
        if (placeHolderCallback) {
            placeHolder = placeHolderCallback(node);
        }
    }
    const center = React.createElement("div", { className: cm(Types_1.CLASSES.FLEXLAYOUT__TABSET_CONTENT) }, placeHolder);
    var content;
    if (node.getTabLocation() === "top") {
        content = React.createElement(React.Fragment, null,
            header,
            tabStrip,
            center);
    }
    else {
        content = React.createElement(React.Fragment, null,
            header,
            center,
            tabStrip);
    }
    return (React.createElement("div", { ref: selfRef, dir: "ltr", "data-layout-path": path, style: style, className: cm(Types_1.CLASSES.FLEXLAYOUT__TABSET), onWheel: onMouseWheel }, content));
};
exports.TabSet = TabSet;
//# sourceMappingURL=TabSet.js.map