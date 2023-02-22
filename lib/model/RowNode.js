"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RowNode = void 0;
const Attribute_1 = require("../Attribute");
const AttributeDefinitions_1 = require("../AttributeDefinitions");
const DockLocation_1 = require("../DockLocation");
const DropInfo_1 = require("../DropInfo");
const Orientation_1 = require("../Orientation");
const Rect_1 = require("../Rect");
const Types_1 = require("../Types");
const BorderNode_1 = require("./BorderNode");
const Node_1 = require("./Node");
const SplitterNode_1 = require("./SplitterNode");
const TabSetNode_1 = require("./TabSetNode");
class RowNode extends Node_1.Node {
    /** @internal */
    constructor(model, json) {
        super(model);
        this._dirty = true;
        this._drawChildren = [];
        this._minHeight = 0;
        this._minWidth = 0;
        RowNode._attributeDefinitions.fromJson(json, this._attributes);
        model._addNode(this);
    }
    /** @internal */
    static _fromJson(json, model) {
        const newLayoutNode = new RowNode(model, json);
        if (json.children != null) {
            for (const jsonChild of json.children) {
                if (jsonChild.type === TabSetNode_1.TabSetNode.TYPE) {
                    const child = TabSetNode_1.TabSetNode._fromJson(jsonChild, model);
                    newLayoutNode._addChild(child);
                }
                else {
                    const child = RowNode._fromJson(jsonChild, model);
                    newLayoutNode._addChild(child);
                }
            }
        }
        return newLayoutNode;
    }
    /** @internal */
    static _createAttributeDefinitions() {
        const attributeDefinitions = new AttributeDefinitions_1.AttributeDefinitions();
        attributeDefinitions.add("type", RowNode.TYPE, true).setType(Attribute_1.Attribute.STRING).setFixed();
        attributeDefinitions.add("id", undefined).setType(Attribute_1.Attribute.STRING);
        attributeDefinitions.add("weight", 100).setType(Attribute_1.Attribute.NUMBER);
        attributeDefinitions.add("width", undefined).setType(Attribute_1.Attribute.NUMBER);
        attributeDefinitions.add("height", undefined).setType(Attribute_1.Attribute.NUMBER);
        return attributeDefinitions;
    }
    getWeight() {
        return this._attributes.weight;
    }
    getWidth() {
        return this._getAttr("width");
    }
    getHeight() {
        return this._getAttr("height");
    }
    /** @internal */
    _setWeight(weight) {
        this._attributes.weight = weight;
    }
    /** @internal */
    _layout(rect, metrics) {
        super._layout(rect, metrics);
        const pixelSize = this._rect._getSize(this.getOrientation());
        let totalWeight = 0;
        let fixedPixels = 0;
        let prefPixels = 0;
        let totalPrefWeight = 0;
        const drawChildren = this._getDrawChildren();
        for (const child of drawChildren) {
            const prefSize = child._getPrefSize(this.getOrientation());
            if (child._isFixed()) {
                if (prefSize !== undefined) {
                    fixedPixels += prefSize;
                }
            }
            else {
                if (prefSize === undefined) {
                    totalWeight += child.getWeight();
                }
                else {
                    prefPixels += prefSize;
                    totalPrefWeight += child.getWeight();
                }
            }
        }
        let resizePreferred = false;
        let availablePixels = pixelSize - fixedPixels - prefPixels;
        if (availablePixels < 0) {
            availablePixels = pixelSize - fixedPixels;
            resizePreferred = true;
            totalWeight += totalPrefWeight;
        }
        // assign actual pixel sizes
        let totalSizeGiven = 0;
        let variableSize = 0;
        for (const child of drawChildren) {
            const prefSize = child._getPrefSize(this.getOrientation());
            if (child._isFixed()) {
                if (prefSize !== undefined) {
                    child._setTempSize(prefSize);
                }
            }
            else {
                if (prefSize == null || resizePreferred) {
                    if (totalWeight === 0) {
                        child._setTempSize(0);
                    }
                    else {
                        const minSize = child.getMinSize(this.getOrientation());
                        const size = Math.floor(availablePixels * (child.getWeight() / totalWeight));
                        child._setTempSize(Math.max(minSize, size));
                    }
                    variableSize += child._getTempSize();
                }
                else {
                    child._setTempSize(prefSize);
                }
            }
            totalSizeGiven += child._getTempSize();
        }
        // adjust sizes to exactly fit
        if (variableSize > 0) {
            while (totalSizeGiven < pixelSize) {
                for (const child of drawChildren) {
                    if (!(child instanceof SplitterNode_1.SplitterNode)) {
                        const prefSize = child._getPrefSize(this.getOrientation());
                        if (!child._isFixed() && (prefSize === undefined || resizePreferred) && totalSizeGiven < pixelSize) {
                            child._setTempSize(child._getTempSize() + 1);
                            totalSizeGiven++;
                        }
                    }
                }
            }
            // decrease size using nodes not at there minimum
            while (totalSizeGiven > pixelSize) {
                let changed = false;
                for (const child of drawChildren) {
                    if (!(child instanceof SplitterNode_1.SplitterNode)) {
                        const minSize = child.getMinSize(this.getOrientation());
                        const size = child._getTempSize();
                        if (size > minSize && totalSizeGiven > pixelSize) {
                            child._setTempSize(child._getTempSize() - 1);
                            totalSizeGiven--;
                            changed = true;
                        }
                    }
                }
                if (!changed) {
                    // all children are at min values
                    break;
                }
            }
            // if still too big then simply reduce all nodes until fits
            while (totalSizeGiven > pixelSize) {
                let changed = false;
                for (const child of drawChildren) {
                    if (!(child instanceof SplitterNode_1.SplitterNode)) {
                        const size = child._getTempSize();
                        if (size > 0 && totalSizeGiven > pixelSize) {
                            child._setTempSize(child._getTempSize() - 1);
                            totalSizeGiven--;
                            changed = true;
                        }
                    }
                }
                if (!changed) {
                    // all children are at 0 values
                    break;
                }
            }
        }
        // layout children
        let p = 0;
        for (const child of drawChildren) {
            if (this.getOrientation() === Orientation_1.Orientation.HORZ) {
                child._layout(new Rect_1.Rect(this._rect.x + p, this._rect.y, child._getTempSize(), this._rect.height), metrics);
            }
            else {
                child._layout(new Rect_1.Rect(this._rect.x, this._rect.y + p, this._rect.width, child._getTempSize()), metrics);
            }
            p += child._getTempSize();
        }
        return true;
    }
    /** @internal */
    _getSplitterBounds(splitterNode, useMinSize = false) {
        const pBounds = [0, 0];
        const drawChildren = this._getDrawChildren();
        const p = drawChildren.indexOf(splitterNode);
        const node1 = drawChildren[p - 1];
        const node2 = drawChildren[p + 1];
        if (this.getOrientation() === Orientation_1.Orientation.HORZ) {
            const minSize1 = useMinSize ? node1.getMinWidth() : 0;
            const minSize2 = useMinSize ? node2.getMinWidth() : 0;
            pBounds[0] = node1.getRect().x + minSize1;
            pBounds[1] = node2.getRect().getRight() - splitterNode.getWidth() - minSize2;
        }
        else {
            const minSize1 = useMinSize ? node1.getMinHeight() : 0;
            const minSize2 = useMinSize ? node2.getMinHeight() : 0;
            pBounds[0] = node1.getRect().y + minSize1;
            pBounds[1] = node2.getRect().getBottom() - splitterNode.getHeight() - minSize2;
        }
        return pBounds;
    }
    /** @internal */
    _calculateSplit(splitter, splitterPos) {
        let rtn;
        const drawChildren = this._getDrawChildren();
        const p = drawChildren.indexOf(splitter);
        const pBounds = this._getSplitterBounds(splitter);
        const weightedLength = drawChildren[p - 1].getWeight() + drawChildren[p + 1].getWeight();
        const pixelWidth1 = Math.max(0, splitterPos - pBounds[0]);
        const pixelWidth2 = Math.max(0, pBounds[1] - splitterPos);
        if (pixelWidth1 + pixelWidth2 > 0) {
            const weight1 = (pixelWidth1 * weightedLength) / (pixelWidth1 + pixelWidth2);
            const weight2 = (pixelWidth2 * weightedLength) / (pixelWidth1 + pixelWidth2);
            rtn = {
                node1Id: drawChildren[p - 1].getId(),
                weight1,
                pixelWidth1,
                node2Id: drawChildren[p + 1].getId(),
                weight2,
                pixelWidth2,
            };
        }
        return rtn;
    }
    /** @internal */
    _getDrawChildren() {
        if (this._dirty) {
            this._drawChildren = [];
            for (let i = 0; i < this._children.length; i++) {
                const child = this._children[i];
                if (i !== 0) {
                    const newSplitter = new SplitterNode_1.SplitterNode(this._model);
                    newSplitter._setParent(this);
                    this._drawChildren.push(newSplitter);
                }
                this._drawChildren.push(child);
            }
            this._dirty = false;
        }
        return this._drawChildren;
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
    /** @internal */
    getMinWidth() {
        return this._minWidth;
    }
    /** @internal */
    getMinHeight() {
        return this._minHeight;
    }
    /** @internal */
    calcMinSize() {
        this._minHeight = 0;
        this._minWidth = 0;
        let first = true;
        for (const child of this._children) {
            const c = child;
            if (c instanceof RowNode) {
                c.calcMinSize();
            }
            if (this.getOrientation() === Orientation_1.Orientation.VERT) {
                this._minHeight += c.getMinHeight();
                if (!first) {
                    this._minHeight += this._model.getSplitterSize();
                }
                this._minWidth = Math.max(this._minWidth, c.getMinWidth());
            }
            else {
                this._minWidth += c.getMinWidth();
                if (!first) {
                    this._minWidth += this._model.getSplitterSize();
                }
                this._minHeight = Math.max(this._minHeight, c.getMinHeight());
            }
            first = false;
        }
    }
    /** @internal */
    _tidy() {
        let i = 0;
        while (i < this._children.length) {
            const child = this._children[i];
            if (child instanceof RowNode) {
                child._tidy();
                const childChildren = child.getChildren();
                if (childChildren.length === 0) {
                    this._removeChild(child);
                }
                else if (childChildren.length === 1) {
                    // hoist child/children up to this level
                    const subchild = childChildren[0];
                    this._removeChild(child);
                    if (subchild instanceof RowNode) {
                        let subChildrenTotal = 0;
                        const subChildChildren = subchild.getChildren();
                        for (const ssc of subChildChildren) {
                            const subsubChild = ssc;
                            subChildrenTotal += subsubChild.getWeight();
                        }
                        for (let j = 0; j < subChildChildren.length; j++) {
                            const subsubChild = subChildChildren[j];
                            subsubChild._setWeight((child.getWeight() * subsubChild.getWeight()) / subChildrenTotal);
                            this._addChild(subsubChild, i + j);
                        }
                    }
                    else {
                        subchild._setWeight(child.getWeight());
                        this._addChild(subchild, i);
                    }
                }
                else {
                    i++;
                }
            }
            else if (child instanceof TabSetNode_1.TabSetNode && child.getChildren().length === 0) {
                if (child.isEnableDeleteWhenEmpty()) {
                    this._removeChild(child);
                    if (child === this._model.getMaximizedTabset()) {
                        this._model._setMaximizedTabset(undefined);
                    }
                }
                else {
                    i++;
                }
            }
            else {
                i++;
            }
        }
        // add tabset into empty root
        if (this === this._model.getRoot() && this._children.length === 0) {
            const callback = this._model._getOnCreateTabSet();
            let attrs = callback ? callback() : {};
            attrs = Object.assign(Object.assign({}, attrs), { selected: -1 });
            const child = new TabSetNode_1.TabSetNode(this._model, attrs);
            this._model._setActiveTabset(child);
            this._addChild(child);
        }
    }
    /** @internal */
    canDrop(dragNode, x, y) {
        const yy = y - this._rect.y;
        const xx = x - this._rect.x;
        const w = this._rect.width;
        const h = this._rect.height;
        const margin = 10; // height of edge rect
        const half = 50; // half width of edge rect
        let dropInfo;
        if (this._model.isEnableEdgeDock() && this._parent === undefined) {
            // _root row
            if (x < this._rect.x + margin && yy > h / 2 - half && yy < h / 2 + half) {
                const dockLocation = DockLocation_1.DockLocation.LEFT;
                const outlineRect = dockLocation.getDockRect(this._rect);
                outlineRect.width = outlineRect.width / 2;
                dropInfo = new DropInfo_1.DropInfo(this, outlineRect, dockLocation, -1, Types_1.CLASSES.FLEXLAYOUT__OUTLINE_RECT_EDGE);
            }
            else if (x > this._rect.getRight() - margin && yy > h / 2 - half && yy < h / 2 + half) {
                const dockLocation = DockLocation_1.DockLocation.RIGHT;
                const outlineRect = dockLocation.getDockRect(this._rect);
                outlineRect.width = outlineRect.width / 2;
                outlineRect.x += outlineRect.width;
                dropInfo = new DropInfo_1.DropInfo(this, outlineRect, dockLocation, -1, Types_1.CLASSES.FLEXLAYOUT__OUTLINE_RECT_EDGE);
            }
            else if (y < this._rect.y + margin && xx > w / 2 - half && xx < w / 2 + half) {
                const dockLocation = DockLocation_1.DockLocation.TOP;
                const outlineRect = dockLocation.getDockRect(this._rect);
                outlineRect.height = outlineRect.height / 2;
                dropInfo = new DropInfo_1.DropInfo(this, outlineRect, dockLocation, -1, Types_1.CLASSES.FLEXLAYOUT__OUTLINE_RECT_EDGE);
            }
            else if (y > this._rect.getBottom() - margin && xx > w / 2 - half && xx < w / 2 + half) {
                const dockLocation = DockLocation_1.DockLocation.BOTTOM;
                const outlineRect = dockLocation.getDockRect(this._rect);
                outlineRect.height = outlineRect.height / 2;
                outlineRect.y += outlineRect.height;
                dropInfo = new DropInfo_1.DropInfo(this, outlineRect, dockLocation, -1, Types_1.CLASSES.FLEXLAYOUT__OUTLINE_RECT_EDGE);
            }
            if (dropInfo !== undefined) {
                if (!dragNode._canDockInto(dragNode, dropInfo)) {
                    return undefined;
                }
            }
        }
        return dropInfo;
    }
    /** @internal */
    drop(dragNode, location, index) {
        const dockLocation = location;
        const parent = dragNode.getParent();
        if (parent) {
            parent._removeChild(dragNode);
        }
        if (parent !== undefined && parent.getType() === TabSetNode_1.TabSetNode.TYPE) {
            parent._setSelected(0);
        }
        if (parent !== undefined && parent.getType() === BorderNode_1.BorderNode.TYPE) {
            parent._setSelected(-1);
        }
        let tabSet;
        if (dragNode instanceof TabSetNode_1.TabSetNode) {
            tabSet = dragNode;
        }
        else {
            const callback = this._model._getOnCreateTabSet();
            tabSet = new TabSetNode_1.TabSetNode(this._model, callback ? callback(dragNode) : {});
            tabSet._addChild(dragNode);
        }
        let size = this._children.reduce((sum, child) => {
            return sum + child.getWeight();
        }, 0);
        if (size === 0) {
            size = 100;
        }
        tabSet._setWeight(size / 3);
        const horz = !this._model.isRootOrientationVertical();
        if (horz && dockLocation === DockLocation_1.DockLocation.LEFT || !horz && dockLocation === DockLocation_1.DockLocation.TOP) {
            this._addChild(tabSet, 0);
        }
        else if (horz && dockLocation === DockLocation_1.DockLocation.RIGHT || !horz && dockLocation === DockLocation_1.DockLocation.BOTTOM) {
            this._addChild(tabSet);
        }
        else if (horz && dockLocation === DockLocation_1.DockLocation.TOP || !horz && dockLocation === DockLocation_1.DockLocation.LEFT) {
            const vrow = new RowNode(this._model, {});
            const hrow = new RowNode(this._model, {});
            hrow._setWeight(75);
            tabSet._setWeight(25);
            for (const child of this._children) {
                hrow._addChild(child);
            }
            this._removeAll();
            vrow._addChild(tabSet);
            vrow._addChild(hrow);
            this._addChild(vrow);
        }
        else if (horz && dockLocation === DockLocation_1.DockLocation.BOTTOM || !horz && dockLocation === DockLocation_1.DockLocation.RIGHT) {
            const vrow = new RowNode(this._model, {});
            const hrow = new RowNode(this._model, {});
            hrow._setWeight(75);
            tabSet._setWeight(25);
            for (const child of this._children) {
                hrow._addChild(child);
            }
            this._removeAll();
            vrow._addChild(hrow);
            vrow._addChild(tabSet);
            this._addChild(vrow);
        }
        this._model._setActiveTabset(tabSet);
        this._model._tidy();
    }
    toJson() {
        const json = {};
        RowNode._attributeDefinitions.toJson(json, this._attributes);
        json.children = [];
        for (const child of this._children) {
            json.children.push(child.toJson());
        }
        return json;
    }
    isEnableDrop() {
        return true;
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
    _getAttributeDefinitions() {
        return RowNode._attributeDefinitions;
    }
    /** @internal */
    _updateAttrs(json) {
        RowNode._attributeDefinitions.update(json, this._attributes);
    }
    /** @internal */
    static getAttributeDefinitions() {
        return RowNode._attributeDefinitions;
    }
}
exports.RowNode = RowNode;
RowNode.TYPE = "row";
/** @internal */
RowNode._attributeDefinitions = RowNode._createAttributeDefinitions();
//# sourceMappingURL=RowNode.js.map