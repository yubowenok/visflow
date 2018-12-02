import { Component, Watch } from 'vue-property-decorator';
import _ from 'lodash';
import $ from 'jquery';


import { DEFAULT_ANIMATION_DURATION_S, ENLARGE_ZINDEX, NODE_CONTENT_PADDING_PX } from '@/common/constants';
import { showSystemMessage, elementContains, mouseOffset } from '@/common/util';
import { SubsetNode } from '@/components/subset-node';
import { SubsetOutputPort, SubsetInputPort } from '@/components/port';
import { SubsetSelection } from '@/data/package';
import { TRANSITION_ELEMENT_LIMIT } from './types';
import { TweenLite } from 'gsap';
import ns from '@/store/namespaces';
import WindowResize from '@/directives/window-resize';
import * as history from './history';
import { HistoryNodeEvent } from '@/store/history/types';

const FAILED_DRAG_TIME_THRESHOLD = 500;
const FAILED_DRAG_DISTANCE_THRESHOLD = 100;
const INITIAL_FAILED_DRAGS_BEFORE_HINT = 3;
const FAILED_DRAGS_BEFORE_HINT_INCREMENT = 2;

interface VisualizationSave {
  selection: number[];
  isTransitionDisabled: boolean;
}

@Component({
  directives: {
    WindowResize,
  },
})
export default class Visualization extends SubsetNode {
  public isVisualization = true;

  protected NODE_TYPE = 'visualization';
  protected DEFAULT_WIDTH = 300;
  protected DEFAULT_HEIGHT = 300;
  protected RESIZABLE = true;
  protected ENLARGEABLE = true;
  protected isInVisMode = true;

  protected selection: SubsetSelection = new SubsetSelection();

  // Tracks the selected items before a selection.
  protected prevSelection: SubsetSelection = new SubsetSelection();

  // Allows the user to disable transition.
  // This is useful to display advancing time series where the primary key is not the table row index,
  // and using row index as rendering elements' keys may result in incorrect transitions.
  protected isTransitionDisabled = false;

  // Specifies an element that responds to dragging when alt-ed.
  protected ALT_DRAG_ELEMENT = '.content';
  // Specifies an element that responds to mouse brush selection.
  protected BRUSH_ELEMENT = '.content > svg';

  protected get svgWidth(): number {
    return this.width - NODE_CONTENT_PADDING_PX * 2;
  }
  protected get svgHeight(): number {
    return this.height - NODE_CONTENT_PADDING_PX * 2;
  }

  @ns.interaction.Getter('isAltPressed') protected isAltPressed!: boolean;

  // Tracks failed mouse drag so as to hint user about dragging a visualization with alt.
  private failedDragCount = 0;
  private failedDragsBeforeHint = INITIAL_FAILED_DRAGS_BEFORE_HINT;

  // Tracks node size during enlargement.
  private beforeEnlargeWidth = 0;
  private beforeEnlargeHeight = 0;

  private brushTime = 0;
  private brushDistance = 0;

  /**
   * Adds onBrushStart, onBrushMove, onBrushStop to the plot area in inheritting class to keep track of brush points.
   */
  private isBrushing = false;
  private brushPoints: Point[] = [];

  /**
   * Allows the system to temporarily disable transition to correctly calculate sizes of screen elements.
   */
  private isTransitionAllowed = true;

  @ns.modals.State('nodeModalVisible') private nodeModalVisible!: boolean;
  @ns.modals.Mutation('openNodeModal') private openNodeModal!: () => void;
  @ns.modals.Mutation('closeNodeModal') private closeNodeModal!: () => void;
  @ns.modals.Mutation('mountNodeModal') private mountNodeModal!: (modal: Element) => void;
  @ns.interaction.State('osCtrlKey') private osCtrlKey!: string;
  @ns.interaction.State('osCtrlKeyChar') private osCtrlKeyChar!: string;

  public undo(evt: HistoryNodeEvent) {
    if (!history.undo(evt)) {
      this.undoBase(evt);
    }
  }

  public redo(evt: HistoryNodeEvent) {
    if (!history.redo(evt)) {
      this.redoBase(evt);
    }
  }

  public onKeys(keys: string): boolean {
    return this.onKeysVisualization(keys);
  }

  public setSelection(selectedItems: number[]) {
    this.selection.setItems(selectedItems);
    this.onSelectionUpdate();
  }

  public getSelectionPort(): SubsetOutputPort {
    return this.outputPortMap.selection;
  }

  /**
   * Sets the columns to be visualized. This is the default call when the column setting is attempted from a
   * service like FlowSense that is outside the option panel.
   * Each visualization class should implement this in order to support FlowSense column setting.
   * @abstract
   */
  public applyColumns(columns: number[]) {
    console.error(`applyColumns() is not implemented for node type ${this.NODE_TYPE}`);
  }

  /**
   * The default behavior of dataset change handler is to reset the columns to be visualized.
   */
  protected onDatasetChange() {
    this.findDefaultColumns();
  }

  /**
   * Searches for default columns to use.
   */
  protected findDefaultColumns() {
    console.error(`findDefaultColumns() is not implemented for node type ${this.NODE_TYPE}`);
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    this.draw();
    this.output();
  }

  /**
   * Base draw method for visualization. Note that "render()" is a reserved Vue life cycle method.
   * @abstract
   */
  protected draw() {
    console.error(`draw() is not implemented for node type ${this.NODE_TYPE}`);
  }

  /**
   * Computes the outputs.
   */
  protected output() {
    this.computeForwarding();
    this.computeSelection();
  }

  /**
   * Responds to brush movement.
   */
  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {}

  /**
   * Responds to selection update.
   */
  protected onSelectionUpdate() {
    this.draw();
    this.computeSelection();
    this.propagateSelection();
  }

  /**
   * Updates the output ports when there is no input dataset.
   */
  protected updateNoDatasetOutput() {
    this.outputPortMap.out.clear();
    this.outputPortMap.selection.clear();
  }

  /**
   * Computes the package for the selection port. This default implementation assumes the visualization
   * node has a single input port 'in' and a single selection port 'selection'.
   */
  protected computeSelection() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const selectionPkg = pkg.subset(this.selection.getItems());
    this.outputPortMap.selection.updatePackage(selectionPkg);
  }

  /**
   * Computes the package for the data forwarding port. This default implementation assumes the visualization
   * node ha s asingle input port 'in'.
   */
  protected computeForwarding() {
    this.forwardSubset(this.inputPortMap.in, this.outputPortMap.out);
  }

  /**
   * Propagates the selection changes by calling dataflow mutation.
   */
  protected propagateSelection() {
    this.portUpdated(this.outputPortMap.selection);
  }

  protected createOutputPorts() {
    this.outputPorts = [
      new SubsetOutputPort({
        data: {
          id: 'selection',
          node: this,
          isSelection: true,
        },
        store: this.$store,
      }),
      new SubsetOutputPort({
        data: {
          id: 'out',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  protected created() {
    this.containerClasses.push('visualization');

    this.serializationChain.push((): VisualizationSave => {
      return {
        selection: this.selection.serialize(),
        isTransitionDisabled: this.isTransitionDisabled,
      };
    });
    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as VisualizationSave;
      this.selection = new SubsetSelection(save.selection);
    });
  }

  protected isTransitionFeasible(numItems: number) {
    if (numItems >= TRANSITION_ELEMENT_LIMIT) {
      // Disable transition automatically when the number of elements is too large.
      this.isTransitionDisabled = true;
    }
    return this.isTransitionAllowed && !this.isTransitionDisabled;
  }

  protected onResizeStart() {
    this.isTransitionAllowed = false;
  }

  protected onResize() {
    if (!this.hasNoDataset() && !this.isAnimating && this.isExpanded) {
      console.log('render', this.NODE_TYPE);
      this.draw();
    }
  }

  protected onResizeStop() {
    this.isTransitionAllowed = true;
  }

  protected onEnlarge() {
    this.draw();
  }

  protected isSelectionEmpty(): boolean {
    return !this.selection.numItems();
  }

  /**
   * Allows dragging a visualization only when alt is pressed, a.k.a. drag mode is on.
   */
  protected isDraggable(evt: MouseEvent, ui?: JQueryUI.DraggableEventUIParams) {
    return this.isDraggableBase(evt);
  }

  protected isDraggableBase(evt: MouseEvent) {
    const $element = $(this.$el).find(this.ALT_DRAG_ELEMENT);
    if (!$element.length) {
      // Element is draggable when the drag element is not visible. It may be when the node has no data.
      return true;
    }
    if (!elementContains($element[0], evt.pageX, evt.pageY)) {
      // The click falls out of the alt drag element. Perform normal drag.
      // This allows dragging outside the plot area.
      return true;
    }
    return this.isAltPressed;
  }

  protected enlarge() {
    this.openNodeModal(); // Notify store that modal has been opened.
    $(this.$refs.node).css('z-index', ENLARGE_ZINDEX);

    this.isEnlarged = true;
    this.beforeEnlargeWidth = this.width;
    this.beforeEnlargeHeight = this.height;
    const view = this.getEnlargedView();
    this.onResizeStart();
    TweenLite.to(this.$refs.node, DEFAULT_ANIMATION_DURATION_S, {
      left: view.x,
      top: view.y,
      width: view.width,
      height: view.height,
      onUpdate: () => {
        this.width = $(this.$refs.node).width() as number;
        this.height = $(this.$refs.node).height() as number;
      },
      onComplete: () => {
        this.width = view.width;
        this.height = view.height;
        this.onEnlarge();
        this.disableDraggable();
        this.disableResizable();
        this.onResizeStop();
      },
    });

    // Must come after setting isEnlarged
    this.$nextTick(() => this.mountNodeModal(this.$refs.enlargeModal as Element));
  }

  protected closeEnlargeModal() {
    this.closeNodeModal(); // Notify store that modal has been closed.
    this.onResizeStart();
    TweenLite.to(this.$refs.node, DEFAULT_ANIMATION_DURATION_S, {
      left: this.x,
      top: this.y,
      width: this.beforeEnlargeWidth,
      height: this.beforeEnlargeHeight,
      onUpdate: () => {
        this.width = $(this.$refs.node).width() as number;
        this.height = $(this.$refs.node).height() as number;
      },
      onComplete: () => {
        $(this.$refs.node).css('z-index', this.layer);
        this.isEnlarged = false;
        this.width = this.beforeEnlargeWidth;
        this.height = this.beforeEnlargeHeight;
        this.enableDraggable();
        this.enableResizable();
        this.onResizeStop();
        this.onEnlargeClose();
      },
    });
  }

  /**
   * Responds to enlarge close. Typically nothing needs to be done. But nodes like network (which applies force based
   * on view size) may want to update specially.
   */
  protected onEnlargeClose() {}

  /**
   * Most visualizations require margin computation by first rendering the labels / ticks and then check the sizes of
   * those texts. The texts must be visible for the check. This is a helper function that momentarily shows the node
   * content, calls the margin update "callback", and then resets the node content's visibility to its original value.
   */
  protected updateMargins(callback: () => void) {
    const $content = $(this.$refs.content);
    const isVisible = $content.is(':visible');
    if (!isVisible) { // getBBox() requires the SVG to be visible to return valid sizes
      $content.show();
    }
    callback();
    if (!isVisible) {
      $content.hide();
    }
  }

  /**
   * Allows the visualization to disable brushing conditionally (e.g. network is not brushable in navigation mode).
   */
  protected isBrushable(): boolean {
    return true;
  }

  /**
   * Records the selection before a brush in order to commit selection history.
   */
  protected recordPrevSelection() {
    this.prevSelection = this.selection.clone();
  }

  /**
   * Commits the seleciton history post a brush.
   */
  protected commitSelectionHistory(message?: string) {
    if (!this.selection.isEqual(this.prevSelection)) {
      this.commitHistory(history.interactiveSelectionEvent(this, this.selection, this.prevSelection, message));
    }
  }

  /**
   * Keys actions for all visualizations.
   */
  protected onKeysVisualization(keys: string): boolean {
    if (keys === this.osCtrlKey + '+a') {
      this.selectAll();
      return true;
    }
    if (keys === this.osCtrlKey + '+shift+a') {
      this.deselectAll();
      return true;
    }
    return this.onKeysNode(keys);
  }

  /**
   * Places every data item into the selection.
   * If a node has additional visual entities to be selected, such as a bar in the history,
   * override this method.
   */
  protected executeSelectAll() {
    const items = this.inputPortMap.in.getSubsetPackage().getItemIndices();
    this.selection.addItems(items);
  }

  /**
   * Removes every data item from the selection, similar to executeSelectAll.
   */
  protected executeDeselectAll() {
    this.selection.clear();
  }

  private selectAll() {
    if (this.hasNoDataset()) {
      return;
    }
    this.recordPrevSelection();
    this.executeSelectAll();
    this.commitSelectionHistory('select all');
    this.onSelectionUpdate();
  }

  private deselectAll() {
    if (this.hasNoDataset()) {
      return;
    }
    this.recordPrevSelection();
    this.executeDeselectAll();
    this.commitSelectionHistory('deselect all');
    this.onSelectionUpdate();
  }

  private onWindowResize(evt: Event) {
    if (this.isEnlarged) {
      const view = this.getEnlargedView();
      $(this.$refs.node).css({
        left: view.x,
        top: view.y,
        width: view.width,
        height: view.height,
      });
    }
  }

  private getEnlargedView(): Box {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    return {
      x: .1 * screenWidth,
      y: .1 * screenHeight,
      width: .8 * screenWidth,
      height: .8 * screenHeight,
    };
  }

  private recordBrushPoint(evt: MouseEvent) {
    const $brushElement = $(this.$refs.node).find(this.BRUSH_ELEMENT);
    if (!$brushElement.length) {
      return;
    }
    const offset = mouseOffset(evt, $brushElement as JQuery<HTMLElement>);
    this.brushPoints.push({ x: offset.left, y: offset.top });
  }

  private onBrushStart(evt: MouseEvent) {
    if (this.isAltPressed || // dragging
      !this.isBrushable() || // other blocking interaction, e.g. navigation
      evt.which !== 1) { // not left click
      return;
    }
    this.isBrushing = true;
    this.brushTime = new Date().getTime();
    this.recordBrushPoint(evt);
  }

  private onBrushMove(evt: MouseEvent) {
    if (!this.isBrushing) {
      return;
    }
    this.recordBrushPoint(evt);
    this.brushed(this.brushPoints);
  }

  private onBrushLeave(evt: MouseEvent) {
    if (!this.isBrushing) {
      return;
    }
    this.onBrushStop(evt);
  }

  private onBrushStop(evt: MouseEvent) {
    if (!this.isBrushing) {
      return;
    }
    this.isBrushing = false;

    this.recordPrevSelection();
    this.brushed(this.brushPoints, true);
    this.commitSelectionHistory();

    if (this.brushPoints.length) {
      const [p, q] = [_.first(this.brushPoints), _.last(this.brushPoints)] as [Point, Point];
      this.brushDistance = Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
    } else {
      this.brushDistance = 0;
    }
    this.brushTime = new Date().getTime() - this.brushTime;
    this.brushPoints = [];

    if (this.isProbablyFailedDrag()) {
      this.onFailedDrag();
    }
  }

  private isProbablyFailedDrag(): boolean {
    if (!this.isSelectionEmpty()) {
      this.failedDragCount = 0; // clear failed count on successful brush
      return false;
    }
    return this.brushDistance > FAILED_DRAG_DISTANCE_THRESHOLD &&
      this.brushTime < FAILED_DRAG_TIME_THRESHOLD;
  }

  private onFailedDrag() {
    this.failedDragCount++;
    if (this.failedDragCount === this.failedDragsBeforeHint) {
      showSystemMessage(this.$store,
          'Hold [Alt] key to drag a visualization node inside the plot area.', 'info');
      this.failedDragCount = 0;
      // TODO: check this?
      // Increases the number of failed drags required before showing the hint again.
      this.failedDragsBeforeHint += FAILED_DRAGS_BEFORE_HINT_INCREMENT;
    }
  }

  /**
   * When Alt is pressed, disables mouse interaction on the plot area.
   */
  @Watch('isAltPressed')
  private onAltPressedChange(value: boolean) {
    if (this.isShiftPressed) {
      // Ignore other key combination.
      return;
    }
    if (value) {
      $(this.$refs.node).find(this.ALT_DRAG_ELEMENT).css('pointer-events', 'none');
    } else {
      $(this.$refs.node).find(this.ALT_DRAG_ELEMENT).css('pointer-events', '');
    }
  }

  @Watch('nodeModalVisible')
  private onNodeModalVisibleChange(value: boolean) {
    if (!value && this.isEnlarged) {
      // Close by global keystroke (escape).
      this.closeEnlargeModal();
    }
  }
}
