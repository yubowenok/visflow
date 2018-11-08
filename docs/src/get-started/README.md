# Get Started

::: tip VisFlow Demo
You may try out VisFlow by without creating an account.
VisFlow works under the demo mode without login.
You may complete all the steps below under the demo mode.
:::

## Load a Dataset

Drag a <node-type type="data-source"></node-type> onto the canvas.
Click on the created data source and its option panel will pop up on the right of the screen.
Click <span class="ui">add dataset</span> and select a dataset to load in the data source.

::: tip Demo Datasets
A few sample datasets are available under the demo mode.
If you would like to use a custom dataset, you need to create an account and upload it.
:::

## Create a Visualization
Let's create a <node-type type="scatterplot"></node-type> to visualize the dataset we just loaded.
After dragging a scatterplot to the canvas, connect the <port-type type="output"></port-type> of the data source to the <port-type type="input"></port-type> of the scatterplot.
You may change the <span class="ui">X Column</span> and <span class="ui">Y Column</span> and other settings of the scatterplot in its option panel.

## Forward Interactive Selection
Interactive selection in a visualization can be forwarded to another node for detailed exploration.
We can create a <node-type type="table"></node-type> to inspect the selected points in the scatterplot.
Connect the <port-type type="selection"></port-type> of the scatterplot to the <port-type type="input"></port-type> of the table.
When the selection in the scatterplot changes, the newly selected rows are reactively shown in the table.

## Highlight Interactive Selection
VisFlow allows you to assign visual properties to data items so that interesting subsets of the input data can be brushed and linked across multiple visualizations.
You may use a <node-type type="visual-editor"></node-type> to set the visual properties on the data items.
In this example, let's highlight the selection from the scatterplot in a histogram.

First create a visual editor for the selection from the scatterplot.
Set the <span class="ui">Color</span> visual property to red in the option panel of the visual editor.
Then create a <node-type type="set-operator"></node-type> and set its <span class="ui">Mode</span> to "Union".
Merge the highlighted selection into the full dataset by connecting both the <port-type type="output"></port-type> of the visual editor and the <port-type type="output"></port-type> of the scatterplot to the <port-type type="multi-input"></port-type> of the union node.
Finally create a <node-type type="histogram"></node-type> and connect it to the <port-type type="output"></port-type> of the union node.

This flow diagram shows the distribution of the selected points from the scatterplot in the histogram.

## Subset Flow
VisFlow uses a subset flow model in which all data transmitted in the dataflow are subsets of table rows from an input table.
The input table rows are never mutated, except that visual properties can be assigned and modified down the dataflow.
Such a design ensures that visual properties can be used to keep track of subsets unambiguously, so that brushing and linking can be well supported for visual data exploration.
Read more about subset flow [here](/dataflow/subsetflow/).


## Next Steps

That's it!
You have successfully completed the basics of VisFlow.
Learn more about the dataflow model behind VisFlow in the [Dataflow Section](/dataflow/).
Checkout the [Node Types](/node/) in VisFlow for the detailed usage of each node type.

Alternatively, you may go ahead and freely explore VisFlow yourself.
Remember to come back whenever you have questions about specific aspects of the system.
