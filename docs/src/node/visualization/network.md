# Network

A <node-type type="network"/> renders a network visualization based on graph input.
A network accepts two input tables: one for the nodes, and the other for the edges.
The two tables must share columns with node identifiers.
The network uses <ui-prop prop="edge-source-column"/> and <ui-prop prop="edge-target-column"/>.

Correspondingly, there are four output ports, for the selection and forwarding of nodes and edges respectively. One dimension can be used for labeling the network nodes.

The Network node has navigation interaction mode. When navigation is on, you may pan and zoom (by mousewheel) the network. When navigation is off, you may interactively select nodes and edges in the network.

## Example
![network](./network.png)

A network showing color encode nodes.

## Selection
Drags and draws a rectangular box to select the nodes and edges inside or partially inside the box.

## Visual Properties

### Nodes
| Type | Effect |
|:----:| ------ |
| color | Fill color of the circle |
| border | Border color of the circle |
| size | Diameter of the circle |
| width | Width of the circle border |
| opacity | Opacity of the circle |

### Edges
| Type | Effect |
|:----:| ------ |
| color | Color of the edge curve and arrow |
| border | Not supported |
| size | Not supported |
| width | Stroke width of the edge curve and arrow |
| opacity | Opacity of the edge curve and arrow |

## Options
### X Column
Configures the column visualized on the X-axis.

### Y Column
COnfigures the column visualized on the Y-axis.

### Navigation
When navigation is on, dragging in the network area performs zooming and panning.
When navigation is off, dragging in the network area makes a rectangular selection.
