# Linker

A <node-type type="linker"/> provides [linking](/dataflow/linking.md) between two input tables.
Typically, the two input tables are heterogenous and share a key column.
Most of the time the keys are primary, and each of the two tables has exactly one data item with a unique key.
But it is also possible to use keys that do not have one-to-one mapping.
For example, to find incident edges of a node in a graph,
the node ID may be used as a key, which corresponds to multiple edges in the edge table.

The table `T1` that connects to the first <port-type type="input"/> provides the shared keys.
These keys are extracted from the <ui-prop prop="extract-column"/> of `T1`.

The table `T2` that connects to the second <port-type type="input"/> gives the subset to be filtered.
The data items in `T2` are kept when they have a <ui-prop prop="filter-column"/> value that equals some value in the extracted keys from `T1`.

A linker is equivalent to a combination of one <node-type type="constants-generator"/> and one <node-type type="attribute-filter"/>,
where the constants generator extracts the keys from `T1` that are used to filter `T2`.
Using a linker may simply diagram connections.

## Options
### Extract Column
Configures the column from which the keys are extracted.
The column is from the first table `T1` that is connected to the first <port-type type="input"/>.


### Filter Column
Configures the column on which filtering is applied on the second table `T2` that is connected to the second <port-type type="input"/>.
The filtering matches the attribute values in this column against the keys extracted from `T1` using <ui-value text="Full String"/> matching.
