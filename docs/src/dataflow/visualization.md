
# Visualization

Visualization nodes render plots of data subsets.
The rendered visualizations are embedded in-situ in the visualization nodes by default.

## Interactive Data Selection
All VisFlow visualizations support interactive data selection.
Selection can directly be made in the plot area of the visualizations.
The selected data items are transmitted via the <port-type type="selection"/> of the visualization nodes.

Interactive selection can be performed in a drag-and-draw manner.
A visualization node may display a rectangular selection box or a lasso stroke when a selection is in progress.
Interactive selection may prevent the node from being dragged and repositioned.
In case node moving is desired, hold the <shortcut-key :keys="['alt']" :hold="['alt']"/> key to temporarily disable interactive selection.
Alternatively, toggle the drag mode by pressing the drag mode button <ui-button icon-classes="fas fa-arrows-alt" text=""/> at the top-right of the navbar.
When the drag mode is active, all data selections in visualizations are disabled.

If a visualization allows navigation, such as in a <node-type type="map"/> or <node-type type="network"/>, interactive selection cannot be performed when navigation mode is active.
Turn off <ui-prop prop="navigation" link=""/> before making a data selection.

## Data Forwarding
Each visualization node also has a data forwarding <port-type type="output"/> that forwards all its input data.
This is for the convenience for successor nodes in the dataflow to retrieve data.


## Visualization Types
VisFlow currently supports the following visualizations:
- <node-type type="table"/>
- <node-type type="scatterplot"/>
- <node-type type="parallel-coordinates"/>
- <node-type type="histogram"/>
- <node-type type="heatmap"/>
- <node-type type="line-chart"/>
- <node-type type="network"/>
- <node-type type="map"/>
