# Subset Flow

The flow diagrams in VisFlow follow the subset flow model.
The subset flow model requires all input and output data of the nodes, if they are not <page-link link="/dataflow/diagram.html#constants" text="constants"/>, must be a subset of table rows from an input table.
By the subset relation, VisFlow is able to uniquely identify a data item and assign visual property to it.
There is no ambiguity in changing the visual properties by a <node-type type="visual-editor"/>, or inheritting the visual properties when merging table in a <node-type type="set-operator"/>.
Consequently, relying on the visual properties the visualizations in VisFlow may render data subsets in consistent styles across nodes and provide native brushing and linking.

The subset flow model restricts data modification within the system.
For example, a VisFlow node cannot add a data column to the table, which would create table rows that do not belong to any of the input tables of the system.
This would introduce ambiguity in assigning visual properties, and hinders subset brushing and highlighting.
Despite some limitation on the data processing capability, the subset flow model has the advantages of reducing the flow diagram complexity, and making subset tracking and comparison easier.
We recommend preprocessing and modifying data before loading them into VisFlow, as VisFlow is not meant to be a data processing tool anyway.
Visflow is more suitable for fast launch data visualization and data exploration on preprocessed data.

For example:
- If a clustering algorithm is to be studied, we may add a column for the cluster labels produced by the clustering algorithm and load the table with a cluster label column into VisFlow.
- If aggregation is needed on the data, we can aggregate them using database query or custom script outside VisFlow and load the aggregated table into VisFlow.
