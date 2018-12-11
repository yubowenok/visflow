---
sidebarDepth: 0
---

# Edit and Interaction

[[toc]]

## Node Panel
To create a node, drag the type of node to be created from the _node panel_ on the left side of the screen, and then drop it on the canvas.
Alternatively, you may use the _quick node panel_ by pressing the shortcut <shortcut-key :keys="['A']"/>.
Node types in the quick node panel can be dragged and dropped in a same manner.

## Edge Connection
To create an edge, drag from an input port to an output port, or vice versa.
You may also drag from a port and drop just on a node, and the system will automatically choose a port on this node that can be connected.

## Option Panel
Options configurable for each node are available in the option panel on the right of the system.
Click a node to activate its option panel.
Click on the canvas to hide the option panel.

## Node Selection
Click a single node to select it.
Hold <shortcut-key :keys="['shift']" :hold="['shift']"/> and click on a single node to select/deselect additional nodes.
Hold <shortcut-key :keys="['shift']" :hold="['shift']"/> and drag on the canvas to draw a selection box to select all nodes inside the box.

## Node Positioning
Drag a node to move it.
When multiple nodes are selected, dragging moves them altogether.

Note that in [visualization](/dataflow/visualization.md) nodes, dragging by default performs interactive data selection.
To drag and position a visualization node, hold the <shortcut-key :keys="['alt']" :hold="['alt']"/> key when dragging.

To perform a large number of visualization repositioning, use the drag mode button <ui-button icon-classes="fas fa-arrows-alt" text=""/> at the top right of the navbar.
When drag mode is activated, data selection is disabled in visualizations and dragging always moves the nodes.

## Canvas Navigation
Click on the canvas and drag to pan and navigate the dataflow diagram.
A navigation icon <ui-button icon-classes="fas fa-arrows-alt" text=""/> appears during canvas panning.

## Context Menu
Right click on the canvas or dataflow diagram elements (nodes, ports, edges) to open the context menu.
The context menu provides shortcuts to some common actions.

## Port Information
Hover over a port to view how many data items pass through that port.

## Undo & Redo
Use the <ui-button icon-classes="fas fa-undo-alt" text="Undo"/> and <ui-button icon-classes="fas fa-redo-alt" text="Redo"/> buttons in the <ui-button text="Edit" dropdown/> dropdown menu in the navbar or the history panel to undo and redo actions.
The history panel also shows all actions that are undoable and redoable.
Click on an action in the history panel to roll back or forward to that action in the history.

## Upload & Manage Datasets
After login, use the _dataset list_ to upload and manage your custom datasets.
To open the dataset list, click the <ui-button icon-classes="fas fa-database" text=""/> button at the top-right of the navbar.
You may delete an uploaded dataset by the <ui-button icon-classes="fas fa-trash" text=""/> delete button in the dataset list.
VisFlow does not preserve a custom dataset once you delete it.

## Save & Load Diagrams
Diagrams can be saved on and loaded from the VisFlow server.
After login, use the <ui-button text="Diagram" dropdown/> dropdown menu in the navbar to save and load diagram.
