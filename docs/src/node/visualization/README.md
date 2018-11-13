
# Visualization

TODO: describe common features of visualization nodes

Visualizations provide plots of data subsets. Plots are embedded in-situ in the visualization nodes by default. Interactively selected data items are sent out via the visualization selection port. Each visualization node additionally has a forwarding (multiple) port that outputs all its input data. This is for the convenience of getting upflow data.

VisFlow currently supports the following visualizations:
- <node-type type="table"/>
- <node-type type="scatterplot"/>
- <node-type type="parallel-coordinates"/>
- <node-type type="histogram"/>
- <node-type type="heatmap"/>
- <node-type type="line-chart"/>
- <node-type type="network"/>
- <node-type type="map"/>
