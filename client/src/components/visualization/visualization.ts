import { Component, Watch } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import { Node } from '@/components/node';
import { SubsetSelection, SubsetPackage } from '@/data/package';
import { SubsetOutputPort, SubsetInputPort } from '@/components/port';
import TabularDataset from '@/data/tabular-dataset';
import { getColumnSelectOptions } from '@/data/util';
import { showSystemMessage, elementContains } from '@/common/util';
import { TweenLite } from 'gsap';
import { DEFAULT_ANIMATION_DURATION_S, ENLARGE_ZINDEX } from '@/common/constants';
import WindowResize from '@/directives/window-resize';

export const TRANSITION_ELEMENT_LIMIT = 5000;
const FAILED_DRAG_THRESHOLD = 3;

export interface VisualizationSave {
  selection: number[];
  lastDatasetHash: string;
}

@Component({
  directives: {
    WindowResize,
  },
})
export default class Visualization extends Node {
  protected NODE_TYPE = 'visualization';
  protected DEFAULT_WIDTH = 300;
  protected DEFAULT_HEIGHT = 300;
  protected RESIZABLE = true;
  protected ENLARGEABLE = true;

  protected isInVisMode = true;

  protected selection: SubsetSelection = new SubsetSelection();

  // Overwrite port typings
  protected inputPortMap: { [id: string]: SubsetInputPort } = {};
  protected outputPortMap: { [id: string]: SubsetOutputPort } = {};

  protected dataset: TabularDataset | null = null; // new TabularDataset({ rows: [], columns: [] });
  protected lastDatasetHash: string = '';

  // Specifies an element that responds to dragging when alt-ed.
  protected ALT_DRAG_ELEMENT = '.content';

  protected isTransitionAllowed = true;

  @ns.interaction.Getter('isAltPressed') private isAltPressed!: boolean;
  @ns.modals.State('nodeModalVisible') private nodeModalVisible!: boolean;
  @ns.modals.Mutation('openNodeModal') private openNodeModal!: () => void;
  @ns.modals.Mutation('closeNodeModal') private closeNodeModal!: () => void;
  @ns.modals.Mutation('mountNodeModal') private mountNodeModal!: (modal: Element) => void;

  // Tracks failed mouse drag so as to hint user about dragging a visualization with alt.
  private failedDragCount = 0;

  // Tracks node size during enlargement.
  private beforeEnlargeWidth = 0;
  private beforeEnlargeHeight = 0;

  /**
   * Updates the output ports when there is no input dataset.
   */
  protected updateNoDatasetOutput() {
    (this.outputPortMap.out as SubsetOutputPort).clearPackageItems();
    (this.outputPortMap.selection as SubsetOutputPort).clearPackageItems();
  }

  /**
   * Computes the package for the selection port. This is the default implementation that assumes the visualization
   * node has a single input port 'in' and a single selection port 'selection'.
   */
  protected computeSelection() {
    const pkg = this.inputPortMap.in.getPackage() as SubsetPackage;
    const selectionPkg = pkg.subset(this.selection.getItems());
    this.outputPortMap.selection.updatePackage(selectionPkg);
  }

  /**
   * Propagates the selection changes by calling dataflow mutation.
   */
  protected propagateSelection() {
    this.portUpdated(this.outputPortMap.selection);
  }

  /**
   * Checks if there is no input dataset.
   */
  protected hasNoDataset(): boolean {
    return !this.inputPortMap.in.isConnected() ||
      !(this.inputPortMap.in.getPackage() as SubsetPackage).hasDataset();
  }

  /**
   * Checks if there is no input dataset, and if so, shows a text message and returns false.
   */
  protected checkDataset(): boolean {
    if (this.hasNoDataset()) {
      this.dataset = null;
      this.coverText = 'No Dataset';
      this.updateNoDatasetOutput();
      return false;
    }
    this.dataset = (this.inputPortMap.in.getPackage() as SubsetPackage).getDataset() as TabularDataset;
    // Check if we have switched from one dataset to another dataset. Datasets must not be undefined and must
    // have a valid hash value. Changing hash from '' (no data) does not trigger onDatasetChange(). This is
    // to preserve node state such as column selection.
    if (this.dataset.getHash() !== this.lastDatasetHash) {
      this.onDatasetChange();
      this.lastDatasetHash = this.dataset.getHash();
    }
    this.coverText = '';
    return true;
  }

  protected createPorts() {
    this.inputPorts = [
      new SubsetInputPort({
        data: {
          id: 'in',
          node: this,
        },
        store: this.$store,
      }),
    ];
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
    this.serializationChain.push((): VisualizationSave => {
      return {
        selection: this.selection.serialize(),
        lastDatasetHash: this.lastDatasetHash,
      };
    });
    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as VisualizationSave;
      this.selection = new SubsetSelection(save.selection);
    });
  }

  /**
   * Performs updates on dataset change, such as re-selecting plotting columns.
   * When this function is called, this.dataset is guaranteed to be defined.
   * @abstract
   */
  protected onDatasetChange() {
    console.error(`onDatasetChange() is not implemented for ${this.NODE_TYPE}`);
  }

  // Typing helper method
  protected getDataset(): TabularDataset {
    return this.dataset as TabularDataset;
  }

  protected get columnSelectOptions() {
    return getColumnSelectOptions(this.dataset);
  }

  protected isTransitionFeasible(numItems: number) {
    return this.isTransitionAllowed && numItems < TRANSITION_ELEMENT_LIMIT;
  }

  /**
   * Allows dragging a visualization only when alt is pressed, a.k.a. drag mode is on.
   */
  protected isDraggable(evt: MouseEvent, ui: JQueryUI.DraggableEventUIParams) {
    const $element = $(this.$el).find(this.ALT_DRAG_ELEMENT);
    if (!$element.length) {
      // Element is draggable when the drag element is not visible. It may be when the node has no data.
      return true;
    }
    if (elementContains($element, evt.pageX, evt.pageY)) {
      if (!this.isAltPressed) {
        this.failedDragCount++;
        if (this.failedDragCount === FAILED_DRAG_THRESHOLD) {
          showSystemMessage(this.$store,
              'Hold [Alt] key to drag a visualization node inside the plot area.', 'info');
          this.failedDragCount = 0;
        }
      } else {
        this.failedDragCount = 0;
      }
    } else {
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
    TweenLite.to(this.$refs.node, DEFAULT_ANIMATION_DURATION_S, {
      left: view.x,
      top: view.y,
      width: view.width,
      height: view.height,
      onComplete: () => {
        this.width = view.width;
        this.height = view.height;
        this.onEnlarge();
        this.disableDraggable();
        this.disableResizable();
      },
    });

    // Must come after setting isEnlarged
    this.$nextTick(() => this.mountNodeModal(this.$refs.enlargeModal as Element));
  }

  protected closeEnlargeModal() {
    this.closeNodeModal(); // Notify store that modal has been closed.
    TweenLite.to(this.$refs.node, DEFAULT_ANIMATION_DURATION_S, {
      left: this.x,
      top: this.y,
      width: this.beforeEnlargeWidth,
      height: this.beforeEnlargeHeight,
      onComplete: () => {
        $(this.$refs.node).css('z-index', this.layer);
        this.isEnlarged = false;
        this.width = this.beforeEnlargeWidth;
        this.height = this.beforeEnlargeHeight;
        this.enableDraggable();
        this.enableResizable();
      },
    });
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

  /**
   * When Alt is pressed, disables mouse interaction on the plot area.
   */
  @Watch('isAltPressed')
  private onAltPressedChange(value: boolean) {
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
