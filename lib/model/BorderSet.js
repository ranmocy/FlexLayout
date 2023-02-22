"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorderSet = void 0;
const Orientation_1 = require("../Orientation");
const BorderNode_1 = require("./BorderNode");
class BorderSet {
    /** @internal */
    constructor(model) {
        this._model = model;
        this._borders = [];
    }
    /** @internal */
    static _fromJson(json, model) {
        const borderSet = new BorderSet(model);
        borderSet._borders = json.map((borderJson) => BorderNode_1.BorderNode._fromJson(borderJson, model));
        return borderSet;
    }
    getBorders() {
        return this._borders;
    }
    /** @internal */
    _forEachNode(fn) {
        for (const borderNode of this._borders) {
            fn(borderNode, 0);
            for (const node of borderNode.getChildren()) {
                node._forEachNode(fn, 1);
            }
        }
    }
    /** @internal */
    _toJson() {
        return this._borders.map((borderNode) => borderNode.toJson());
    }
    /** @internal */
    _layoutBorder(outerInnerRects, metrics) {
        const rect = outerInnerRects.outer;
        const rootRow = this._model.getRoot();
        let height = Math.max(0, rect.height - rootRow.getMinHeight());
        let width = Math.max(0, rect.width - rootRow.getMinWidth());
        let sumHeight = 0;
        let sumWidth = 0;
        let adjustableHeight = 0;
        let adjustableWidth = 0;
        const showingBorders = this._borders.filter((border) => border.isShowing());
        // sum size of borders to see they will fit
        for (const border of showingBorders) {
            border._setAdjustedSize(border.getSize());
            const visible = border.getSelected() !== -1;
            if (border.getLocation().getOrientation() === Orientation_1.Orientation.HORZ) {
                sumWidth += border.getBorderBarSize();
                if (visible) {
                    width -= this._model.getSplitterSize();
                    sumWidth += border.getSize();
                    adjustableWidth += border.getSize();
                }
            }
            else {
                sumHeight += border.getBorderBarSize();
                if (visible) {
                    height -= this._model.getSplitterSize();
                    sumHeight += border.getSize();
                    adjustableHeight += border.getSize();
                }
            }
        }
        // adjust border sizes if too large
        let j = 0;
        let adjusted = false;
        while ((sumWidth > width && adjustableWidth > 0) || (sumHeight > height && adjustableHeight > 0)) {
            const border = showingBorders[j];
            if (border.getSelected() !== -1) {
                // visible
                const size = border._getAdjustedSize();
                if (sumWidth > width && adjustableWidth > 0 && border.getLocation().getOrientation() === Orientation_1.Orientation.HORZ && size > 0
                    && size > border.getMinSize()) {
                    border._setAdjustedSize(size - 1);
                    sumWidth--;
                    adjustableWidth--;
                    adjusted = true;
                }
                else if (sumHeight > height && adjustableHeight > 0 && border.getLocation().getOrientation() === Orientation_1.Orientation.VERT && size > 0
                    && size > border.getMinSize()) {
                    border._setAdjustedSize(size - 1);
                    sumHeight--;
                    adjustableHeight--;
                    adjusted = true;
                }
            }
            j = (j + 1) % showingBorders.length;
            if (j === 0) {
                if (adjusted) {
                    adjusted = false;
                }
                else {
                    break;
                }
            }
        }
        for (const border of showingBorders) {
            outerInnerRects.outer = border._layoutBorderOuter(outerInnerRects.outer, metrics);
        }
        outerInnerRects.inner = outerInnerRects.outer;
        for (const border of showingBorders) {
            outerInnerRects.inner = border._layoutBorderInner(outerInnerRects.inner, metrics);
        }
        return outerInnerRects;
    }
    /** @internal */
    _findDropTargetNode(dragNode, x, y) {
        for (const border of this._borders) {
            if (border.isShowing()) {
                const dropInfo = border.canDrop(dragNode, x, y);
                if (dropInfo !== undefined) {
                    return dropInfo;
                }
            }
        }
        return undefined;
    }
}
exports.BorderSet = BorderSet;
//# sourceMappingURL=BorderSet.js.map