import { TableView } from "./Table";

const { ccclass, property } = cc._decorator;

// Base Cell Class - Extend this for your custom cells
// Base Cell Class - Extend this for your custom cells
@ccclass()
export class TableViewCell extends cc.Component {
    protected tableView: TableView = null;
    protected cellData: any = null;
    protected cellIndex: number = -1;
    protected groupIndex: number[] = [0, 0];
    protected isDragging: boolean = false;
    protected longClickScheduled: boolean = false;
    protected originalParent: cc.Node = null;
    protected originalPos: cc.Vec3 = new cc.Vec3();
    protected dragClone: cc.Node = null; // Add this
    protected isLongClicked: boolean = false;

    onLoad() {
        this.setupTouchEvents();
    }

    protected setupTouchEvents() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    // Called by TableView to initialize cell
    _cellInit_(tableView: TableView) {
        this.tableView = tableView;
    }

    // Called by TableView to update cell data
    updateCell(index: number, data: any, forceUpdate: boolean = false, groupIndex: number[] = [0, 0]) {
        this.cellIndex = index;
        this.cellData = data;
        this.groupIndex = groupIndex;
        this.onUpdateCell(index, data, forceUpdate);
    }

    // Override this in your custom cell
    protected onUpdateCell(index: number, data: any, forceUpdate: boolean) {
        // Implement your cell update logic here
    }

    protected onTouchStart(event: cc.Event.EventTouch) {
        cc.error('onTouchStart called');
        if (this.node.active && this.node.opacity !== 0) {
            if (this.canDrag()) {
                this.longClickScheduled = true;

                // Visual feedback: scale down slightly
                cc.tween(this.node)
                    .to(0.5, { scale: 0.95 })
                    .call(() => { this.isLongClicked = true; })
                    .start();

                this.scheduleOnce(this.onLongPressForDrag, 0.5);
            }
        }
    }

    protected onTouchMove(event: cc.Event.EventTouch) {
        const delta = event.getLocation().subtract(event.getStartLocation());
        const moveDistance = delta.len();
        // cc.log('onTouchMove called', this.longClickScheduled, this.isLongClicked, moveDistance, this.isDragging);

        if (this.longClickScheduled && this.isLongClicked && moveDistance > 10) {
            cc.error('onTouchMove long click', event.getCurrentTarget());
            this.longClickScheduled = false;
            this.unschedule(this.onLongPressForDrag);

            // Cancel visual feedback
            cc.Tween.stopAllByTarget(this.node);
            this.node.scale = 1.0;
        }

        if (this.isDragging && this.isLongClicked) {
            // cc.error('onTouchMove dragging', event.getCurrentTarget());
            this.onDragging(event);
            event.stopPropagation();
        }
    }

    protected onTouchEnd(event: cc.Event.EventTouch) {
        cc.error('onTouchEnd called');
        // Reset scale
        cc.Tween.stopAllByTarget(this.node);
        // if (!this.isDragging) {
        this.node.scale = 1.0;
        // }

        const delta = event.getLocation().subtract(event.getStartLocation());
        const moveDistance = delta.len();

        // Cancel long press timer
        if (this.longClickScheduled) {
            this.longClickScheduled = false;
            this.longClickScheduled = false;
            this.unschedule(this.onLongPressForDrag);

            // This was a tap/click (not a long press)
            if (moveDistance < 10) {
                this.onClick();
                event.stopPropagation();
            }
        }

        if (this.isDragging && this.isLongClicked && event) {
            this.isDragging = false;
            this.isLongClicked = false;
            this.endDrag(event);
            // event.stopPropagation();
        }
    }

    protected onTouchCancel(event: cc.Event.EventTouch) {
        cc.error('onTouchCancel called');
        cc.Tween.stopAllByTarget(this.node);
        this.node.scale = 1.0;

        if (this.longClickScheduled) {
            this.longClickScheduled = false;
            this.unschedule(this.onLongPressForDrag);
        }

        if (this.isDragging) {
            this.isDragging = false;
            this.isLongClicked = false;

            // Re-enable ScrollView on cancel too
            if (this.tableView) {
                this.tableView.enabled = true;
            }

            this.endDrag(event);
        }
    }

    protected canDrag(): boolean {
        return this.tableView && this.tableView.enableCellDrag;
    }

    // New method: Start drag on long press
    protected onLongPressForDrag() {
        this.longClickScheduled = false;

        if (this.canDrag()) {
            this.isDragging = true;

            // Create visual feedback that drag mode is active
            this.originalParent = this.node.parent;
            this.originalPos = this.node.position.clone();

            // Create dragging clone
            this.dragClone = cc.instantiate(this.node);
            this.dragClone.opacity = 200;
            this.dragClone.scale = 1.1;

            if (this.tableView) {
                const worldPos = this.originalParent.convertToWorldSpaceAR(this.node.position);
                this.tableView.node.addChild(this.dragClone);
                const localPos = this.tableView.node.convertToNodeSpaceAR(worldPos);
                this.dragClone.setPosition(localPos);

                // Dim original cell
                this.node.opacity = 100;

                this.onDragStart();
            }

            // ✅ Instead, disable the ScrollView temporarily
            if (this.tableView) {
                this.tableView.enabled = false;
            }
        }
    }

    protected onDragging(event: cc.Event.EventTouch) {
        if (!this.dragClone) return;

        const delta = event.getDelta();
        this.dragClone.setPosition(
            this.dragClone.position.x + delta.x,
            this.dragClone.position.y + delta.y,
            this.dragClone.position.z
        );

        if (this.tableView && typeof this.tableView.onCellDragging === 'function') {
            this.tableView.onCellDragging(this, event.getLocation());
        }
    }

    protected endDrag(event: cc.Event.EventTouch) {
        let handled = false;

        // Restore original cell opacity
        this.node.opacity = 255;

        // Re-enable ScrollView
        if (this.tableView) {
            this.tableView.enabled = true;
        }

        // Try to handle drag end through callback
        if (this.tableView && typeof this.tableView.onCellDragEnd === 'function') {
            handled = this.tableView.onCellDragEnd(this, event.getLocation());
        }

        // Animate clone back if not handled
        if (!handled && this.dragClone) {
            const worldPos = this.originalParent.convertToWorldSpaceAR(this.originalPos);
            const targetPos = this.tableView.node.convertToNodeSpaceAR(worldPos);

            // Animate back to original position
            cc.tween(this.dragClone)
                .to(0.2, { position: targetPos }, { easing: 'backOut' })
                .call(() => {
                    if (this.dragClone) {
                        this.dragClone.destroy();
                        this.dragClone = null;
                    }
                })
                .start();
        } else if (this.dragClone) {
            // If handled, destroy clone immediately
            this.dragClone.destroy();
            this.dragClone = null;
        }

        this.onDragEnd();
    }

    // protected returnToOriginal() {
    //     if (this.originalParent) {
    //         // const worldPos = this.node.parent
    //         //     .convertToWorldSpaceAR(this.node.position);

    //         this.node.removeFromParent();
    //         this.originalParent.addChild(this.node);

    //         this.node.setPosition(this.originalPos);
    //     }
    // }

    // Override these in your custom cell
    protected onClick() {
        if (this.tableView && this.tableView.onCellClicked) {
            this.tableView.onCellClicked(this.cellIndex, this.cellData, this);
        }
    }

    protected onLongClick() {
        this.longClickScheduled = false;
        this.node.emit(cc.Node.EventType.TOUCH_CANCEL);

        if (this.tableView && this.tableView.onCellLongClicked) {
            this.tableView.onCellLongClicked(this.cellIndex, this.cellData, this);
        }
    }

    protected onDragStart() {
        // Override for custom drag start behavior
    }

    protected onDragEnd() {
        // Override for custom drag end behavior
    }

    getCellIndex(): number {
        return this.cellIndex;
    }

    getCellData(): any {
        return this.cellData;
    }

    onDestroy() {
        if (this.dragClone) {
            this.dragClone.destroy();
            this.dragClone = null;
        }

        this.unschedule(this.onLongPressForDrag); // Clean up timer

        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }
}