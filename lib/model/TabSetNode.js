"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabSetNode = void 0;
const Attribute_1 = require("../Attribute");
const AttributeDefinitions_1 = require("../AttributeDefinitions");
const DockLocation_1 = require("../DockLocation");
const DropInfo_1 = require("../DropInfo");
const Orientation_1 = require("../Orientation");
const Rect_1 = require("../Rect");
const Types_1 = require("../Types");
const BorderNode_1 = require("./BorderNode");
const Node_1 = require("./Node");
const RowNode_1 = require("./RowNode");
const TabNode_1 = require("./TabNode");
const Utils_1 = require("./Utils");
class TabSetNode extends Node_1.Node {
    /** @internal */
    constructor(model, json) {
        super(model);
        TabSetNode._attributeDefinitions.fromJson(json, this._attributes);
        model._addNode(this);
        this._calculatedTabBarHeight = 0;
        this._calculatedHeaderBarHeight = 0;
    }
    /** @internal */
    static _fromJson(json, model) {
        const newLayoutNode = new TabSetNode(model, json);
        if (json.children != null) {
            for (const jsonChild of json.children) {
                const child = TabNode_1.TabNode._fromJson(jsonChild, model);
                newLayoutNode._addChild(child);
            }
        }
        if (newLayoutNode._children.length === 0) {
            newLayoutNode._setSelected(-1);
        }
        if (json.maximized && json.maximized === true) {
            model._setMaximizedTabset(newLayoutNode);
        }
        if (json.active && json.active === true) {
            model._setActiveTabset(newLayoutNode);
        }
        return newLayoutNode;
    }
    /** @internal */
    static _createAttributeDefinitions() {
        const attributeDefinitions = new AttributeDefinitions_1.AttributeDefinitions();
        attributeDefinitions.add("type", TabSetNode.TYPE, true).setType(Attribute_1.Attribute.STRING).setFixed();
        attributeDefinitions.add("id", undefined).setType(Attribute_1.Attribute.STRING);
        attributeDefinitions.add("weight", 100).setType(Attribute_1.Attribute.NUMBER);
        attributeDefinitions.add("width", undefined).setType(Attribute_1.Attribute.NUMBER);
        attributeDefinitions.add("height", undefined).setType(Attribute_1.Attribute.NUMBER);
        attributeDefinitions.add("selected", 0).setType(Attribute_1.Attribute.NUMBER);
        attributeDefinitions.add("name", undefined).setType(Attribute_1.Attribute.STRING);
        attributeDefinitions.add("config", undefined).setType("any");
        attributeDefinitions.addInherited("enableDeleteWhenEmpty", "tabSetEnableDeleteWhenEmpty");
        attributeDefinitions.addInherited("enableDrop", "tabSetEnableDrop");
        attributeDefinitions.addInherited("enableDrag", "tabSetEnableDrag");
        attributeDefinitions.addInherited("enableDivide", "tabSetEnableDivide");
        attributeDefinitions.addInherited("enableMaximize", "tabSetEnableMaximize");
        attributeDefinitions.addInherited("enableClose", "tabSetEnableClose");
        attributeDefinitions.addInherited("classNameTabStrip", "tabSetClassNameTabStrip");
        attributeDefinitions.addInherited("classNameHeader", "tabSetClassNameHeader");
        attributeDefinitions.addInherited("enableTabStrip", "tabSetEnableTabStrip");
        attributeDefinitions.addInherited("borderInsets", "tabSetBorderInsets");
        attributeDefinitions.addInherited("marginInsets", "tabSetMarginInsets");
        attributeDefinitions.addInherited("minWidth", "tabSetMinWidth");
        attributeDefinitions.addInherited("minHeight", "tabSetMinHeight");
        attributeDefinitions.addInherited("headerHeight", "tabSetHeaderHeight");
        attributeDefinitions.addInherited("tabStripHeight", "tabSetTabStripHeight");
        attributeDefinitions.addInherited("tabLocation", "tabSetTabLocation");
        attributeDefinitions.addInherited("autoSelectTab", "tabSetAutoSelectTab").setType(Attribute_1.Attribute.BOOLEAN);
        return attributeDefinitions;
    }
    getName() {
        return this._getAttr("name");
    }
    getSelected() {
        const selected = this._attributes.selected;
        if (selected !== undefined) {
            return selected;
        }
        return -1;
    }
    getSelectedNode() {
        const selected = this.getSelected();
        if (selected !== -1) {
            return this._children[selected];
        }
        return undefined;
    }
    getWeight() {
        return this._getAttr("weight");
    }
    getWidth() {
        return this._getAttr("width");
    }
    getMinWidth() {
        return this._getAttr("minWidth");
    }
    getHeight() {
        return this._getAttr("height");
    }
    getMinHeight() {
        return this._getAttr("minHeight");
    }
    /** @internal */
    getMinSize(orientation) {
        if (orientation === Orientation_1.Orientation.HORZ) {
            return this.getMinWidth();
        }
        else {
            return this.getMinHeight();
        }
    }
    /**
     * Returns the config attribute that can be used to store node specific data that
     * WILL be saved to the json. The config attribute should be changed via the action Actions.updateNodeAttributes rather
     * than directly, for example:
     * this.state.model.doAction(
     *   FlexLayout.Actions.updateNodeAttributes(node.getId(), {config:myConfigObject}));
     */
    getConfig() {
        return this._attributes.config;
    }
    isMaximized() {
        return this._model.getMaximizedTabset() === this;
    }
    isActive() {
        return this._model.getActiveTabset() === this;
    }
    isEnableDeleteWhenEmpty() {
        return this._getAttr("enableDeleteWhenEmpty");
    }
    isEnableDrop() {
        return this._getAttr("enableDrop");
    }
    isEnableDrag() {
        return this._getAttr("enableDrag");
    }
    isEnableDivide() {
        return this._getAttr("enableDivide");
    }
    isEnableMaximize() {
        return this._getAttr("enableMaximize");
    }
    isEnableClose() {
        return this._getAttr("enableClose");
    }
    canMaximize() {
        if (this.isEnableMaximize()) {
            // always allow maximize toggle if already maximized
            if (this.getModel().getMaximizedTabset() === this) {
                return true;
            }
            // only one tabset, so disable
            if (this.getParent() === this.getModel().getRoot() && this.getModel().getRoot().getChildren().length === 1) {
                return false;
            }
            return true;
        }
        return false;
    }
    isEnableTabStrip() {
        return this._getAttr("enableTabStrip");
    }
    isAutoSelectTab() {
        return this._getAttr("autoSelectTab");
    }
    getClassNameTabStrip() {
        return this._getAttr("classNameTabStrip");
    }
    getClassNameHeader() {
        return this._getAttr("classNameHeader");
    }
    /** @internal */
    calculateHeaderBarHeight(metrics) {
        const headerBarHeight = this._getAttr("headerHeight");
        if (headerBarHeight !== 0) {
            // its defined
            this._calculatedHeaderBarHeight = headerBarHeight;
        }
        else {
            this._calculatedHeaderBarHeight = metrics.headerBarSize;
        }
    }
    /** @internal */
    calculateTabBarHeight(metrics) {
        const tabBarHeight = this._getAttr("tabStripHeight");
        if (tabBarHeight !== 0) {
            // its defined
            this._calculatedTabBarHeight = tabBarHeight;
        }
        else {
            this._calculatedTabBarHeight = metrics.tabBarSize;
        }
    }
    getHeaderHeight() {
        return this._calculatedHeaderBarHeight;
    }
    getTabStripHeight() {
        return this._calculatedTabBarHeight;
    }
    getTabLocation() {
        return this._getAttr("tabLocation");
    }
    /** @internal */
    _setWeight(weight) {
        this._attributes.weight = weight;
    }
    /** @internal */
    _setSelected(index) {
        this._attributes.selected = index;
    }
    /** @internal */
    canDrop(dragNode, x, y) {
        let dropInfo;
        if (dragNode === this) {
            const dockLocation = DockLocation_1.DockLocation.CENTER;
            const outlineRect = this._tabHeaderRect;
            dropInfo = new DropInfo_1.DropInfo(this, outlineRect, dockLocation, -1, Types_1.CLASSES.FLEXLAYOUT__OUTLINE_RECT);
        }
        else if (this._contentRect.contains(x, y)) {
            let dockLocation = DockLocation_1.DockLocation.CENTER;
            if (this._model.getMaximizedTabset() === undefined) {
                dockLocation = DockLocation_1.DockLocation.getLocation(this._contentRect, x, y);
            }
            const outlineRect = dockLocation.getDockRect(this._rect);
            dropInfo = new DropInfo_1.DropInfo(this, outlineRect, dockLocation, -1, Types_1.CLASSES.FLEXLAYOUT__OUTLINE_RECT);
        }
        else if (this._tabHeaderRect != null && this._tabHeaderRect.contains(x, y)) {
            let r;
            let yy;
            let h;
            if (this._children.length === 0) {
                r = this._tabHeaderRect.clone();
                yy = r.y + 3;
                h = r.height - 4;
                r.width = 2;
            }
            else {
                let child = this._children[0];
                r = child.getTabRect();
                yy = r.y;
                h = r.height;
                let p = this._tabHeaderRect.x;
                let childCenter = 0;
                for (let i = 0; i < this._children.length; i++) {
                    child = this._children[i];
                    r = child.getTabRect();
                    childCenter = r.x + r.width / 2;
                    if (x >= p && x < childCenter) {
                        const dockLocation = DockLocation_1.DockLocation.CENTER;
                        const outlineRect = new Rect_1.Rect(r.x - 2, yy, 3, h);
                        dropInfo = new DropInfo_1.DropInfo(this, outlineRect, dockLocation, i, Types_1.CLASSES.FLEXLAYOUT__OUTLINE_RECT);
                        break;
                    }
                    p = childCenter;
                }
            }
            if (dropInfo == null) {
                const dockLocation = DockLocation_1.DockLocation.CENTER;
                const outlineRect = new Rect_1.Rect(r.getRight() - 2, yy, 3, h);
                dropInfo = new DropInfo_1.DropInfo(this, outlineRect, dockLocation, this._children.length, Types_1.CLASSES.FLEXLAYOUT__OUTLINE_RECT);
            }
        }
        if (!dragNode._canDockInto(dragNode, dropInfo)) {
            return undefined;
        }
        return dropInfo;
    }
    /** @internal */
    _layout(rect, metrics) {
        this.calculateHeaderBarHeight(metrics);
        this.calculateTabBarHeight(metrics);
        if (this.isMaximized()) {
            rect = this._model.getRoot().getRect();
        }
        rect = rect.removeInsets(this._getAttr("marginInsets"));
        this._rect = rect;
        rect = rect.removeInsets(this._getAttr("borderInsets"));
        const showHeader = this.getName() !== undefined;
        let y = 0;
        let h = 0;
        if (showHeader) {
            y += this._calculatedHeaderBarHeight;
            h += this._calculatedHeaderBarHeight;
        }
        if (this.isEnableTabStrip()) {
            if (this.getTabLocation() === "top") {
                this._tabHeaderRect = new Rect_1.Rect(rect.x, rect.y + y, rect.width, this._calculatedTabBarHeight);
            }
            else {
                this._tabHeaderRect = new Rect_1.Rect(rect.x, rect.y + rect.height - this._calculatedTabBarHeight, rect.width, this._calculatedTabBarHeight);
            }
            h += this._calculatedTabBarHeight;
            if (this.getTabLocation() === "top") {
                y += this._calculatedTabBarHeight;
            }
        }
        this._contentRect = new Rect_1.Rect(rect.x, rect.y + y, rect.width, rect.height - h);
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            child._layout(this._contentRect, metrics);
            child._setVisible(i === this.getSelected());
        }
    }
    /** @internal */
    _delete() {
        this._parent._removeChild(this);
    }
    /** @internal */
    _remove(node) {
        const removedIndex = this._removeChild(node);
        this._model._tidy();
        (0, Utils_1.adjustSelectedIndex)(this, removedIndex);
    }
    /** @internal */
    drop(dragNode, location, index, select) {
        const dockLocation = location;
        if (this === dragNode) {
            // tabset drop into itself
            return; // dock back to itself
        }
        let dragParent = dragNode.getParent();
        let fromIndex = 0;
        if (dragParent !== undefined) {
            fromIndex = dragParent._removeChild(dragNode);
            // if selected node in border is being docked into tabset then deselect border tabs
            if (dragParent instanceof BorderNode_1.BorderNode && dragParent.getSelected() === fromIndex) {
                dragParent._setSelected(-1);
            }
            else {
                (0, Utils_1.adjustSelectedIndex)(dragParent, fromIndex);
            }
        }
        // if dropping a tab back to same tabset and moving to forward position then reduce insertion index
        if (dragNode.getType() === TabNode_1.TabNode.TYPE && dragParent === this && fromIndex < index && index > 0) {
            index--;
        }
        // simple_bundled dock to existing tabset
        if (dockLocation === DockLocation_1.DockLocation.CENTER) {
            let insertPos = index;
            if (insertPos === -1) {
                insertPos = this._children.length;
            }
            if (dragNode.getType() === TabNode_1.TabNode.TYPE) {
                this._addChild(dragNode, insertPos);
                if (select || (select !== false && this.isAutoSelectTab())) {
                    this._setSelected(insertPos);
                }
                // console.log("added child at : " + insertPos);
            }
            else {
                for (let i = 0; i < dragNode.getChildren().length; i++) {
                    const child = dragNode.getChildren()[i];
                    this._addChild(child, insertPos);
                    // console.log("added child at : " + insertPos);
                    insertPos++;
                }
                if (this.getSelected() === -1 && this._children.length > 0) {
                    this._setSelected(0);
                }
            }
            this._model._setActiveTabset(this);
        }
        else {
            let tabSet;
            if (dragNode instanceof TabNode_1.TabNode) {
                // create new tabset parent
                // console.log("create a new tabset");
                const callback = this._model._getOnCreateTabSet();
                tabSet = new TabSetNode(this._model, callback ? callback(dragNode) : {});
                tabSet._addChild(dragNode);
                // console.log("added child at end");
                dragParent = tabSet;
            }
            else {
                tabSet = dragNode;
            }
            const parentRow = this._parent;
            const pos = parentRow.getChildren().indexOf(this);
            if (parentRow.getOrientation() === dockLocation._orientation) {
                tabSet._setWeight(this.getWeight() / 2);
                this._setWeight(this.getWeight() / 2);
                // console.log("added child 50% size at: " +  pos + dockLocation.indexPlus);
                parentRow._addChild(tabSet, pos + dockLocation._indexPlus);
            }
            else {
                // create a new row to host the new tabset (it will go in the opposite direction)
                // console.log("create a new row");
                const newRow = new RowNode_1.RowNode(this._model, {});
                newRow._setWeight(this.getWeight());
                newRow._addChild(this);
                this._setWeight(50);
                tabSet._setWeight(50);
                // console.log("added child 50% size at: " +  dockLocation.indexPlus);
                newRow._addChild(tabSet, dockLocation._indexPlus);
                parentRow._removeChild(this);
                parentRow._addChild(newRow, pos);
            }
            this._model._setActiveTabset(tabSet);
        }
        this._model._tidy();
    }
    toJson() {
        const json = {};
        TabSetNode._attributeDefinitions.toJson(json, this._attributes);
        json.children = this._children.map((child) => child.toJson());
        if (this.isActive()) {
            json.active = true;
        }
        if (this.isMaximized()) {
            json.maximized = true;
        }
        return json;
    }
    /** @internal */
    _updateAttrs(json) {
        TabSetNode._attributeDefinitions.update(json, this._attributes);
    }
    /** @internal */
    _getAttributeDefinitions() {
        return TabSetNode._attributeDefinitions;
    }
    /** @internal */
    _getPrefSize(orientation) {
        let prefSize = this.getWidth();
        if (orientation === Orientation_1.Orientation.VERT) {
            prefSize = this.getHeight();
        }
        return prefSize;
    }
    /** @internal */
    static getAttributeDefinitions() {
        return TabSetNode._attributeDefinitions;
    }
}
exports.TabSetNode = TabSetNode;
TabSetNode.TYPE = "tabset";
/** @internal */
TabSetNode._attributeDefinitions = TabSetNode._createAttributeDefinitions();
//# sourceMappingURL=TabSetNode.js.map