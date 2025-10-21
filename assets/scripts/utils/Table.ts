import ObjectPool from "../modules/ObjectPool";
import { TableViewCell } from "./Cell";

const { ccclass, property } = cc._decorator;

export enum ScrollDirection {
    NONE = 0,
    UP = 1,
    DOWN = 2,
    LEFT = 3,
    RIGHT = 4
}

export enum LayoutMode {
    VERTICAL = 0,      // Vertical list
    HORIZONTAL = 1,    // Horizontal list
    VERTICAL_GRID = 2, // Vertical scrolling grid
    HORIZONTAL_GRID = 3 // Horizontal scrolling grid
}

export enum ViewType {
    SCROLL = 0,  // Normal scrolling
    PAGE = 1     // Page-based scrolling (flip pages)
}

@ccclass()
export class TableView extends cc.ScrollView {
    @property(cc.Prefab)
    cellPrefab: cc.Prefab = null;

    @property({ type: cc.Enum(LayoutMode), tooltip: "Layout mode for table" })
    layoutMode: LayoutMode = LayoutMode.VERTICAL;

    @property({ type: cc.Enum(ViewType), tooltip: "Scroll or Page mode" })
    viewType: ViewType = ViewType.SCROLL;

    @property({ tooltip: "Fill empty space with cells" })
    isFill: boolean = false;

    @property({ tooltip: "Number of columns (for grid modes)" })
    columnsCount: number = 1;

    @property({ tooltip: "Number of rows (for horizontal grid)" })
    rowsCount: number = 1;

    @property({ tooltip: "Left padding" })
    paddingLeft: number = 0;

    @property({ tooltip: "Right padding" })
    paddingRight: number = 0;

    @property({ tooltip: "Top padding" })
    paddingTop: number = 0;

    @property({ tooltip: "Bottom padding" })
    paddingBottom: number = 0;

    @property({ tooltip: "Horizontal spacing between cells" })
    spacingX: number = 0;

    @property({ tooltip: "Vertical spacing between cells" })
    spacingY: number = 0;

    @property({ tooltip: "Enable cell dragging" })
    enableCellDrag: boolean = false;

    // Callbacks
    public onCellClicked: (index: number, data: any, cell: TableViewCell) => void = null;
    public onCellLongClicked: (index: number, data: any, cell: TableViewCell) => void = null;
    public onCellDragging: (cell: TableViewCell, position: cc.Vec2) => void = null;
    public onCellDragEnd: (cell: TableViewCell, position: cc.Vec2) => boolean = null;
    public onPageChanged: (page: number, totalPages: number) => void = null;

    // Private properties
    private dataSource: any[] = [];
    private cellPool: ObjectPool = null;
    private cellSize: cc.Size = new cc.Size(0, 0);
    private groupCellCount: number = 1;
    private minCellIndex: number = 0;
    private maxCellIndex: number = 0;
    private totalCellCount: number = 0;
    private visibleCellCount: number = 0;
    private showCellCount: number = 0;
    private scrollDirection: ScrollDirection = ScrollDirection.NONE;
    private lastOffset: cc.Vec2 = new cc.Vec2(0, 0);
    private currentPage: number = 1;
    private totalPages: number = 2;
    private tempView: cc.Node = null;
    private lastContentPos: cc.Vec2 = cc.Vec2.ZERO;

    private static cellPoolCache: { [key: string]: ObjectPool } = {};

    onLoad() {
        // Let super initialize first, but catch any errors
        try {
            super.onLoad();
        } catch (e) {
            console.warn('TableView: super.onLoad() failed, will initialize later');
        }
    }

    start() {
        // Initialize after everything is set up
        this._lateInit();
    }

    private _lateInit() {
        if (!this.content) {
            console.error('TableView: content node is not set');
            return;
        }

        // Setup view reference
        if (this.content && this.content.parent) {
            this.tempView = this.content.parent;
            // Configure scroll direction
            if (this.layoutMode === LayoutMode.VERTICAL || this.layoutMode === LayoutMode.VERTICAL_GRID) {
                this.vertical = true;
                this.horizontal = false;
                this.horizontalScrollBar = null;
            } else {
                this.horizontal = true;
                this.vertical = false;
                this.verticalScrollBar = null;
            }

            // Page mode doesn't need inertia
            if (this.viewType === ViewType.PAGE) {
                this.inertia = false;
            }

        }
    }

    // Initialize table with data
    initTableView(dataCount: number, data: any[] = null, callback?: () => void) {
        // CRITICAL: Make sure tempView is set
        if (!this.tempView && this.content && this.content.parent) {
            this.tempView = this.content.parent;
        }

        if (!this.tempView) {
            console.error('TableView: tempView is not initialized. Make sure content and its parent are set up properly.');
            return;
        }

        // cc.log(`TableView: Initializing with ${dataCount} items`, data);
        this.dataSource = data || [];

        // Setup cell pool
        const poolName = this.getCellPoolName();
        if (!TableView.cellPoolCache[poolName]) {
            TableView.cellPoolCache[poolName] = new ObjectPool(this.cellPrefab, 'TableViewCell');
        }
        this.cellPool = TableView.cellPoolCache[poolName];

        // Calculate cell size and layout
        this.calculateLayout(dataCount, () => {
            this.createInitialCells(() => {
                this.registerScrollEvent();
                callback && callback();
            });
        });
    }

    private getCellPoolName(): string {
        if (this.layoutMode === LayoutMode.HORIZONTAL || this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            return `${this.cellPrefab.name}_h_${this.content.height}`;
        }
        return `${this.cellPrefab.name}_v_${this.content.width}`;
    }

    private calculateLayout(dataCount: number, callback: () => void) {
        // Get cell size
        this.getCellSize((size) => {
            this.cellSize = size;
            cc.error(`Cell size: ${size.width} x ${size.height}`);

            // Get group cell count (cells per row/column)
            this.groupCellCount = this.getGroupCellCount();

            // Calculate total groups needed
            this.totalCellCount = Math.ceil(dataCount / this.groupCellCount);

            // console.log(`Data count: ${dataCount}`);
            // console.log(`Group cell count (columns/rows): ${this.groupCellCount}`);
            // console.log(`Total cell count (rows/columns needed): ${this.totalCellCount}`);

            // Calculate visible cells
            if (this.layoutMode === LayoutMode.HORIZONTAL || this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
                this.calculateHorizontalLayout();
            } else {
                this.calculateVerticalLayout();
            }

            this.lastOffset = this.getScrollOffset();
            let pos = this.content.position.clone();
            this.lastContentPos = new cc.Vec2(pos.x, pos.y);
            this.minCellIndex = 0;
            this.maxCellIndex = this.visibleCellCount - 1;

            callback();
        });
    }

    private calculateVerticalLayout() {
        if (!this.tempView) {
            console.error('TableView: tempView is null in calculateVerticalLayout');
            return;
        }

        const viewHeight = this.tempView.height;

        // Add safety check for cell size
        if (this.cellSize.height <= 0) {
            console.error('Cell height is 0 or negative! Cannot calculate layout');
            return;
        }

        // Calculate visible cells considering spacing
        let effectiveCellHeight = this.cellSize.height + this.spacingY;
        let availableHeight = viewHeight - this.paddingTop - this.paddingBottom;

        // For grid mode, we need to calculate based on rows
        if (this.layoutMode === LayoutMode.VERTICAL_GRID) {
            // Each "cell" in vertical grid contains a row of columns
            // So we calculate how many rows are visible
            this.visibleCellCount = Math.ceil(availableHeight / effectiveCellHeight) + 1;
        } else {
            // For vertical list, each cell is one item
            this.visibleCellCount = Math.ceil(availableHeight / effectiveCellHeight) + 1;
        }

        // console.log(`View height: ${viewHeight}, Cell height: ${this.cellSize.height}, Spacing: ${this.spacingY}`);
        // console.log(`Effective cell height: ${effectiveCellHeight}, Visible count: ${this.visibleCellCount}`);

        if (this.viewType === ViewType.PAGE) {
            if (this.visibleCellCount > this.totalCellCount) {
                this.visibleCellCount = this.isFill ?
                    Math.floor(availableHeight / effectiveCellHeight) :
                    this.totalCellCount;
                this.showCellCount = this.visibleCellCount;
                this.totalPages = 1;
            } else {
                this.totalPages = Math.ceil(this.totalCellCount / (this.visibleCellCount - 1));
                this.totalCellCount = this.totalPages * (this.visibleCellCount - 1);
                this.showCellCount = this.visibleCellCount - 1;
            }
        } else {
            if (this.visibleCellCount > this.totalCellCount) {
                this.visibleCellCount = this.isFill ?
                    Math.floor(availableHeight / effectiveCellHeight) :
                    this.totalCellCount;
                this.showCellCount = this.visibleCellCount;
            } else {
                this.showCellCount = this.visibleCellCount - 1;
            }
        }

        // Calculate content height with spacing
        // Last cell doesn't need spacing after it
        this.content.height =
            this.totalCellCount * this.cellSize.height +
            Math.max(0, this.totalCellCount - 1) * this.spacingY +
            this.paddingTop +
            this.paddingBottom;

        this.stopAutoScroll();
        this.scrollToTop(0);

        this.lastOffset = this.getScrollOffset();
        let pos = this.content.position.clone();
        this.lastContentPos = new cc.Vec2(pos.x, pos.y);  // Initialize
        this.minCellIndex = 0;
        this.maxCellIndex = this.visibleCellCount - 1;

    }

    private calculateHorizontalLayout() {
        if (!this.tempView) {
            console.error('TableView: tempView is null in calculateHorizontalLayout');
            return;
        }

        const viewWidth = this.tempView.width;

        // Add safety check for cell size
        if (this.cellSize.width <= 0) {
            console.error('Cell width is 0 or negative! Cannot calculate layout');
            return;
        }

        // Calculate visible cells considering spacing
        let effectiveCellWidth = this.cellSize.width + this.spacingX;
        let availableWidth = viewWidth - this.paddingLeft - this.paddingRight;

        // For grid mode, we need to calculate based on columns
        if (this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            // Each "cell" in horizontal grid contains a column of rows
            // So we calculate how many columns are visible
            this.visibleCellCount = Math.ceil(availableWidth / effectiveCellWidth) + 1;
        } else {
            // For horizontal list, each cell is one item
            this.visibleCellCount = Math.ceil(availableWidth / effectiveCellWidth) + 1;
        }

        // console.log(`View width: ${viewWidth}, Cell width: ${this.cellSize.width}, Spacing: ${this.spacingX}`);
        // console.log(`Effective cell width: ${effectiveCellWidth}, Visible count: ${this.visibleCellCount}`);

        if (this.viewType === ViewType.PAGE) {
            if (this.visibleCellCount > this.totalCellCount) {
                this.visibleCellCount = this.isFill ?
                    Math.floor(availableWidth / effectiveCellWidth) :
                    this.totalCellCount;
                this.showCellCount = this.visibleCellCount;
                this.totalPages = 1;
            } else {
                this.totalPages = Math.ceil(this.totalCellCount / (this.visibleCellCount - 1));
                this.totalCellCount = this.totalPages * (this.visibleCellCount - 1);
                this.showCellCount = this.visibleCellCount - 1;
            }
        } else {
            if (this.visibleCellCount > this.totalCellCount) {
                this.visibleCellCount = this.isFill ?
                    Math.floor(availableWidth / effectiveCellWidth) :
                    this.totalCellCount;
                this.showCellCount = this.visibleCellCount;
            } else {
                this.showCellCount = this.visibleCellCount - 1;
            }
        }

        // Calculate content width with spacing
        // Last cell doesn't need spacing after it
        this.content.width =
            this.totalCellCount * this.cellSize.width +
            Math.max(0, this.totalCellCount - 1) * this.spacingX +
            this.paddingLeft +
            this.paddingRight;

        this.stopAutoScroll();
        this.scrollToLeft(0);

        this.lastOffset = this.getScrollOffset();
        let pos = this.content.position.clone();
        this.lastContentPos = new cc.Vec2(pos.x, pos.y);  // Initialize
        this.minCellIndex = 0;
        this.maxCellIndex = this.visibleCellCount - 1;
    }

    private getCellSize(callback: (size: cc.Size) => void) {
        this.getCell((cell) => {
            let size = cell.getContentSize();

            // For grid modes, calculate the actual cell group size
            if (this.layoutMode === LayoutMode.VERTICAL_GRID) {
                // In vertical grid, one "cell" is a row containing multiple columns
                // Width should fit all columns with spacing
                size.width = this.content.width - this.paddingLeft - this.paddingRight;
                // Height is just one item's height
            } else if (this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
                // In horizontal grid, one "cell" is a column containing multiple rows
                // Height should fit all rows with spacing
                size.height = this.content.height - this.paddingTop - this.paddingBottom;
                // Width is just one item's width
            }

            // console.log(`Cell size calculated: ${size.width} x ${size.height}`);
            this.cellPool.put(cell);
            callback(size);
        });
    }

    private getGroupCellCount(): number {
        // cc.log('Calculating group cell count for layout mode', this.layoutMode);
        // For grid modes, count the number of items per group
        if (this.layoutMode === LayoutMode.VERTICAL_GRID) {
            // For vertical grid, it's the number of columns
            return (this.columnsCount);
        } else if (this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            // For horizontal grid, it's columns * rows
            return (this.rowsCount);
        } else {
            // For simple lists (VERTICAL or HORIZONTAL), each cell is one item
            return (1);
        }
    }

    private getCell(callback: (cell: cc.Node) => void) {
        if (this.cellPool.size() === 0) {
            this.createCellNode((cell) => {
                this.cellPool.put(cell);
                callback(this.cellPool.get());
            });
        } else {
            const cell = this.cellPool.get();
            callback(cell);
        }
    }

    private createCellNode(callback: (cell: cc.Node) => void) {
        if (this.layoutMode === LayoutMode.VERTICAL_GRID) {
            // Create a container node for the row
            const rowContainer = new cc.Node('GridRow');
            rowContainer.setAnchorPoint(0.5, 0.5);

            // Create multiple cells (columns) in this row
            let totalWidth = 0;
            let maxHeight = 0;
            let createdCount = 0;

            const createColumn = (colIndex: number) => {
                const itemCell = cc.instantiate(this.cellPrefab);
                itemCell.setAnchorPoint(0.5, 0.5);
                rowContainer.addChild(itemCell);

                // Position each column
                const xPos = colIndex * (itemCell.width + this.spacingX) -
                    ((this.columnsCount - 1) * (itemCell.width + this.spacingX)) / 2;
                itemCell.setPosition(xPos, 0, 0);

                totalWidth = Math.max(totalWidth,
                    this.columnsCount * itemCell.width + (this.columnsCount - 1) * this.spacingX);
                maxHeight = Math.max(maxHeight, itemCell.height);

                createdCount++;
                if (createdCount >= this.columnsCount) {
                    rowContainer.setContentSize(totalWidth, maxHeight);
                    callback(rowContainer);
                }
            };

            for (let i = 0; i < this.columnsCount; i++) {
                createColumn(i);
            }

        } else if (this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            // Create a container node for the column
            const colContainer = new cc.Node('GridColumn');
            colContainer.setAnchorPoint(0.5, 0.5);

            // Create multiple cells (rows) in this column
            let maxWidth = 0;
            let totalHeight = 0;
            let createdCount = 0;

            const createRow = (rowIndex: number) => {
                const itemCell = cc.instantiate(this.cellPrefab);
                itemCell.setAnchorPoint(0.5, 0.5);
                colContainer.addChild(itemCell);

                // Position each row
                const yPos = ((this.rowsCount - 1) * (itemCell.height + this.spacingY)) / 2 -
                    rowIndex * (itemCell.height + this.spacingY);
                itemCell.setPosition(0, yPos, 0);

                maxWidth = Math.max(maxWidth, itemCell.width);
                totalHeight = Math.max(totalHeight,
                    this.rowsCount * itemCell.height + (this.rowsCount - 1) * this.spacingY);

                createdCount++;
                if (createdCount >= this.rowsCount) {
                    colContainer.setContentSize(maxWidth, totalHeight);
                    callback(colContainer);
                }
            };

            // cc.log(`Creating horizontal grid with ${this.rowsCount} rows`);
            for (let i = 0; i < this.rowsCount; i++) {
                createRow(i);
            }

        } else if (this.layoutMode === LayoutMode.HORIZONTAL) {
            const cell = cc.instantiate(this.cellPrefab);
            cell.setAnchorPoint(0.5, 0.5);
            this.setupHorizontalListCell(cell, callback);
        } else {
            const cell = cc.instantiate(this.cellPrefab);
            cell.setAnchorPoint(0.5, 0.5);
            this.setupVerticalListCell(cell, callback);
        }
    }

    private setupVerticalListCell(cell: cc.Node, callback: (cell: cc.Node) => void) {
        cell.width = this.content.width - this.paddingLeft - this.paddingRight;
        callback(cell);
    }

    private setupHorizontalListCell(cell: cc.Node, callback: (cell: cc.Node) => void) {
        const cellTransform = cell;
        cellTransform.height = this.content.height - this.paddingTop - this.paddingBottom;
        callback(cell);
    }

    // private setupVerticalGridCell(cell: cc.Node, callback: (cell: cc.Node) => void) {
    //     // Grid cells maintain their size from prefab
    //     callback(cell);
    // }

    // private setupHorizontalGridCell(cell: cc.Node, callback: (cell: cc.Node) => void) {
    //     // Grid cells maintain their size from prefab
    //     callback(cell);
    // }

    private createInitialCells(callback: () => void) {
        let createdCount = 0;

        // console.log(`Content size: ${this.content.width} x ${this.content.height}`);

        const createNext = () => {
            // cc.log(`Creating cell ${createdCount}`);
            if (createdCount <= this.maxCellIndex) {
                this.addCell(createdCount, () => {
                    createdCount++;
                    createNext();
                });
            } else {
                callback();
            }
        };

        createNext();
    }

    private addCell(index: number, callback: () => void) {
        this.getCell((cell) => {
            this.setCellAttributes(cell, index);
            this.setCellPosition(cell, index);
            cell.parent = this.content;
            this.initCell(cell, false, callback);
        });
    }

    private setCellAttributes(cell: cc.Node, index: number) {
        cell.setSiblingIndex(index);
        (cell as any)._cellIndex = index;
    }

    private setCellPosition(cell: cc.Node, index: number) {
        if (this.layoutMode === LayoutMode.HORIZONTAL || this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            if (index === 0) {
                cell.setPosition(
                    -this.content.width * this.content.anchorX +
                    cell.width * cell.anchorX + this.paddingLeft,
                    (cell.anchorY - this.content.anchorY) * cell.height - this.paddingTop,
                    0
                );
            } else {
                const prevCell = this.getCellByIndex(index - 1);
                if (prevCell) {
                    cell.setPosition(
                        prevCell.position.x + cell.width + this.spacingX,
                        (cell.anchorY - this.content.anchorY) * cell.height - this.paddingTop,
                        0
                    );
                }
            }
        } else {
            if (index === 0) {
                cell.setPosition(
                    (cell.anchorX - this.content.anchorX) * cell.width + this.paddingLeft,
                    this.content.height * (1 - this.content.anchorY) -
                    cell.height * (1 - cell.anchorY) - this.paddingTop,
                    0
                );
            } else {
                const prevCell = this.getCellByIndex(index - 1);
                if (prevCell) {
                    cell.setPosition(
                        (cell.anchorX - this.content.anchorX) * cell.width + this.paddingLeft,
                        prevCell.position.y - cell.height - this.spacingY,
                        0
                    );
                }
            }
        }
    }

    private initCell(cell: cc.Node, forceUpdate: boolean, callback?: () => void) {
        const cellIndex = (cell as any)._cellIndex;
        const dataIndex = cellIndex * this.groupCellCount;

        if (this.layoutMode === LayoutMode.VERTICAL_GRID || this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            // For GRID: each child node has a TableViewCell component
            for (let i = 0; i < cell.children.length; i++) {
                const childCell = cell.children[i].getComponent(TableViewCell);
                if (childCell) {
                    childCell._cellInit_(this);
                    const index = dataIndex + i;

                    // Check if this index has actual data
                    if (index < this.dataSource.length) {
                        const data = this.dataSource[index];
                        childCell.updateCell(index, data, forceUpdate, [cellIndex, i]);
                        childCell.node.active = true; // Show the cell
                    } else {
                        // No data for this slot - hide it
                        childCell.node.active = false;
                    }
                }
            }
        } else {
            // For SIMPLE LIST: the component is on the ROOT node (cell itself)
            const cellComponent = cell.getComponent(TableViewCell);
            if (cellComponent) {
                cellComponent._cellInit_(this);
                const index = dataIndex;

                // Check if this index has actual data
                if (index < this.dataSource.length) {
                    const data = this.dataSource[index];
                    cellComponent.updateCell(index, data, forceUpdate, [cellIndex, 0]);
                    cellComponent.node.active = true;
                } else {
                    cellComponent.node.active = false;
                }
            } else {
                console.error(`TableViewCell component not found on cell ${cellIndex}!`, cell);
            }
        }

        callback && callback();
    }

    private getCellByIndex(index: number): cc.Node {
        for (const child of this.content.children) {
            if ((child as any)._cellIndex === index) {
                return child;
            }
        }
        return null;
    }

    private registerScrollEvent() {
        // Scroll events are handled in update()
        // this.node.on('scroll-ended', this.onScrollEnded, this);
    }

    update(dt: number) {
        super.update(dt);

        // Only update cells if we're scrolling and not showing all cells
        // cc.log('update', this.visibleCellCount, this.showCellCount, this.totalPages, this.visibleCellCount !== this.showCellCount && this.totalPages !== 1);
        if (this.visibleCellCount !== this.showCellCount && this.totalPages !== 1) {
            this.updateScrollDirection();
            this.updateVisibleCells();
        }
    }

    private updateScrollDirection() {
        const currentPos = this.content.position.clone();
        const delta = new cc.Vec2(
            currentPos.x - this.lastContentPos.x,
            currentPos.y - this.lastContentPos.y
        );
        this.lastContentPos = new cc.Vec2(currentPos.x, currentPos.y);

        const threshold = 0.1;

        if (this.layoutMode === LayoutMode.HORIZONTAL || this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            // For horizontal: content moves LEFT (negative) when scrolling RIGHT
            // cc.log('delta.x', delta.x);
            if (delta.x < -threshold) {
                this.scrollDirection = ScrollDirection.RIGHT;
            } else if (delta.x > threshold) {
                this.scrollDirection = ScrollDirection.LEFT;
            } else {
                this.scrollDirection = ScrollDirection.NONE;
            }
        } else {
            // For vertical: content moves DOWN (negative) when scrolling DOWN
            // With anchor (0, 1), content.y becomes more negative as you scroll down
            if (delta.y < -threshold) {
                this.scrollDirection = ScrollDirection.DOWN;  // Content moving down = scrolling down
            } else if (delta.y > threshold) {
                this.scrollDirection = ScrollDirection.UP;    // Content moving up = scrolling up
            } else {
                this.scrollDirection = ScrollDirection.NONE;
            }
        }
    }

    private updateVisibleCells() {
        const viewRect = this.getBoundingBoxToWorld(this.tempView);

        if (this.layoutMode === LayoutMode.HORIZONTAL || this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            this.updateHorizontalCells(viewRect);
        } else {
            this.updateVerticalCells(viewRect);
        }
    }

    private updateHorizontalCells(viewRect: cc.Rect) {
        if (this.scrollDirection === ScrollDirection.RIGHT) {
            while (this.maxCellIndex < this.totalCellCount - 1) {
                const minCell = this.getCellByIndex(this.minCellIndex);
                // cc.log('minCell', minCell);
                if (!minCell) break;

                const minRect = this.getBoundingBoxToWorld(minCell);
                // cc.log('minRect', minRect, 'viewRect', viewRect, minRect.xMax, viewRect.xMin);
                if (minRect.xMax > viewRect.xMin) break;

                const maxCell = this.getCellByIndex(this.maxCellIndex);
                minCell.setPosition(
                    maxCell.position.x + minCell.width + this.spacingX,
                    minCell.position.y,
                    0
                );

                this.minCellIndex++;
                this.maxCellIndex++;
                this.setCellAttributes(minCell, this.maxCellIndex);
                this.initCell(minCell, false);
            }
        } else if (this.scrollDirection === ScrollDirection.LEFT && this.minCellIndex > 0) {
            while (this.minCellIndex > 0) {
                const maxCell = this.getCellByIndex(this.maxCellIndex);
                // cc.log('maxCell', maxCell);
                if (!maxCell) break;

                const maxRect = this.getBoundingBoxToWorld(maxCell);
                // cc.log('maxRect', maxRect, 'viewRect', viewRect, maxRect.xMin, viewRect.xMax);
                if (maxRect.xMin < viewRect.xMax) break;

                const minCell = this.getCellByIndex(this.minCellIndex);
                maxCell.setPosition(
                    minCell.position.x - minCell.width - this.spacingX,
                    maxCell.position.y,
                    0
                );

                this.minCellIndex--;
                this.maxCellIndex--;
                this.setCellAttributes(maxCell, this.minCellIndex);
                this.initCell(maxCell, false);
            }
        }
    }

    private updateVerticalCells(viewRect: cc.Rect) {
        if (this.scrollDirection === ScrollDirection.UP) {
            while (this.maxCellIndex < this.totalCellCount - 1) {
                const minCell = this.getCellByIndex(this.minCellIndex);
                if (!minCell) break;

                const minRect = this.getBoundingBoxToWorld(minCell);
                if (minRect.yMin < viewRect.yMax) break;

                const maxCell = this.getCellByIndex(this.maxCellIndex);
                minCell.setPosition(
                    minCell.position.x,
                    maxCell.position.y - minCell.height - this.spacingY,
                    0
                );

                this.minCellIndex++;
                this.maxCellIndex++;
                this.setCellAttributes(minCell, this.maxCellIndex);
                this.initCell(minCell, true);
            }
        } else if (this.scrollDirection === ScrollDirection.DOWN && this.minCellIndex > 0) {
            while (this.minCellIndex > 0) {
                const maxCell = this.getCellByIndex(this.maxCellIndex);
                // cc.log('maxCell', maxCell);
                if (!maxCell) break;

                const maxRect = this.getBoundingBoxToWorld(maxCell);
                // cc.log('maxRect', maxRect, 'viewRect', viewRect, maxRect.yMax, viewRect.yMin);
                if (maxRect.yMax > viewRect.yMin) break;

                const minCell = this.getCellByIndex(this.minCellIndex);
                maxCell.setPosition(
                    maxCell.position.x,
                    minCell.position.y + minCell.height + this.spacingY,
                    0
                );

                this.minCellIndex--;
                this.maxCellIndex--;
                this.setCellAttributes(maxCell, this.minCellIndex);
                this.initCell(maxCell, true);
            }
        }
    }

    private getBoundingBoxToWorld(cell: cc.Node): cc.Rect {
        const worldPos = cell.convertToWorldSpaceAR(new cc.Vec2(-cell.width / 2, -cell.height / 2));
        return new cc.Rect(worldPos.x, worldPos.y, cell.width, cell.height);
    }

    public getCellIndexAtPosition(position: cc.Vec2): number {
        for (const child of this.content.children) {
            const rect = this.getBoundingBoxToWorld(child);
            if (rect.contains(position)) {
                return (child as any)._cellIndex;
            }
        }
        return -1;
    }

    // Public API
    reloadData(data?: any[]) {
        if (data !== undefined) {
            this.dataSource = data;
        }

        for (let i = this.content.children.length - 1; i >= 0; i--) {
            this.initCell(this.content.children[i], true);
        }
    }

    clear() {
        if (this.content && this.cellPool) {
            for (let i = this.content.children.length - 1; i >= 0; i--) {
                this.cellPool.put(this.content.children[i]);
            }
            this.visibleCellCount = 0;
            this.showCellCount = 0;
        }
    }

    getData(): any[] {
        return this.dataSource;
    }

    // Page navigation (for PAGE mode)
    scrollToPage(page: number, duration: number = 0.3) {
        if (this.viewType !== ViewType.PAGE || page === this.currentPage) return;
        if (page < 1 || page > this.totalPages) return;

        const pageDiff = Math.abs(page - this.currentPage);
        const time = duration * pageDiff;
        this.changePageNumber(page - this.currentPage);

        if (this.layoutMode === LayoutMode.HORIZONTAL || this.layoutMode === LayoutMode.HORIZONTAL_GRID) {
            const x = (this.currentPage - 1) * this.tempView.width;
            this.scrollToOffset(new cc.Vec2(x, 0), time);
        } else {
            const y = (this.currentPage - 1) * this.tempView.height;
            this.scrollToOffset(new cc.Vec2(0, y), time);
        }
    }

    scrollToNextPage() {
        this.scrollToPage(this.currentPage + 1);
    }

    scrollToPreviousPage() {
        this.scrollToPage(this.currentPage - 1);
    }

    private changePageNumber(delta: number) {
        this.currentPage += delta;
        this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));

        if (this.onPageChanged) {
            this.onPageChanged(this.currentPage, this.totalPages);
        }
    }



    // Static method to create table from code
    static createTable(parent: cc.Node, config: {
        cellPrefab: cc.Prefab,
        layoutMode?: LayoutMode,
        viewType?: ViewType,
        columnsCount?: number,
        rowsCount?: number,
        spacingX?: number,
        spacingY?: number,
        padding?: { left: number, right: number, top: number, bottom: number },
        viewSize?: cc.Size,
        enableCellDrag?: boolean
    }): TableView {
        // Create main node
        const tableNode = new cc.Node('TableView');
        tableNode.setContentSize(parent.getContentSize());

        // Create view node
        const viewNode = new cc.Node('view');
        tableNode.addChild(viewNode);

        const viewSize = config.viewSize || parent ? parent.getContentSize() : new cc.Size(750, 1000);
        viewNode.setContentSize(viewSize);
        const mask = viewNode.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.RECT;


        // Create content node
        const contentNode = new cc.Node('content');
        viewNode.addChild(contentNode);
        contentNode.setContentSize(viewSize);
        contentNode.setAnchorPoint(0, 1);

        // Add to parent BEFORE adding component
        parent.addChild(tableNode);
        // Add Widget to make it resize with parent
        const widget = tableNode.addComponent(cc.Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;

        // Add TableView component
        const tableView = tableNode.addComponent(TableView);

        // Configure TableView

        tableView.content = contentNode;
        tableView.cellPrefab = config.cellPrefab;
        let cellSize = config.cellPrefab.data.getContentSize();
        if (cellSize.width <= 0 || cellSize.height <= 0) {
            console.error('Cell prefab has invalid size! Defaulting to 100x100');
            cellSize = new cc.Size(100, 100);
        }
        tableView.layoutMode = config.layoutMode || LayoutMode.VERTICAL;
        tableView.viewType = config.viewType || ViewType.SCROLL;
        tableView.columnsCount = config.columnsCount || this.calculateColumnsCountForWidth(viewSize.width, cellSize.width, config.spacingX || 0, config.padding ? config.padding.left : 0, config.padding ? config.padding.right : 0);
        tableView.rowsCount = config.rowsCount || this.calculateRowsCountForWidth(viewSize.height, cellSize.height, config.spacingY || 0, config.padding ? config.padding.top : 0, config.padding ? config.padding.bottom : 0);
        tableView.spacingX = config.spacingX;
        tableView.spacingY = config.spacingY;
        tableView.enableCellDrag = config.enableCellDrag || false;

        if (config.padding) {
            tableView.paddingLeft = config.padding.left;
            tableView.paddingRight = config.padding.right;
            tableView.paddingTop = config.padding.top;
            tableView.paddingBottom = config.padding.bottom;
        }

        // Configure scroll direction
        if (tableView.layoutMode === LayoutMode.VERTICAL || tableView.layoutMode === LayoutMode.VERTICAL_GRID) {
            tableView.vertical = true;
            tableView.horizontal = false;
        } else {
            tableView.horizontal = true;
            tableView.vertical = false;
        }

        return tableView;
    }

    private static calculateColumnsCountForWidth(width: number = 1000, cellWidth: number = 1, spacingX: number = 0, paddingLeft: number = 0, paddingRight: number = 0): number {
        if (cellWidth <= 0) {
            console.error('Cell width is 0 or negative! Cannot calculate columns count');
            return 1;
        }
        const effectiveCellWidth = cellWidth + spacingX;
        const availableWidth = width - paddingLeft - paddingRight;
        return Math.max(1, Math.floor(availableWidth / effectiveCellWidth));
    }

    private static calculateRowsCountForWidth(height: number = 1000, cellHeight: number = 1, spacingY: number = 0, paddingTop: number = 0, paddingBottom: number = 0): number {
        if (cellHeight <= 0) {
            console.error('Cell width is 0 or negative! Cannot calculate columns count');
            return 1;
        }
        const effectiveCellHeight = cellHeight + spacingY;
        const availableHeight = height - paddingTop - paddingBottom;
        return Math.max(1, Math.floor(availableHeight / effectiveCellHeight));
    }

    onDestroy() {
        super.onDestroy();
        this.clear();

        // Clean up cell pool
        const poolName = this.getCellPoolName();
        if (TableView.cellPoolCache[poolName]) {
            TableView.cellPoolCache[poolName].clear();
            delete TableView.cellPoolCache[poolName];
        }
    }

}