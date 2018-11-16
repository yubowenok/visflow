# Linker

A <node-type type="linker"/> provides <page-link link="/dataflow/linking" text="linking"/> between two input tables.
Typically, the two input tables are heterogenous and share a primary-key column.

The table `T1` that connects to the first <port-type type="input"/> provides the primary keys.
The primary keys are extracted from the <ui-prop prop="extract-column"/> of `T1`.

The table `T2` that connects to the second <port-type type="input"/> gives the subset to be filtered.
The data items in `T2` are kept when they have a <ui-prop prop="filter-column"/> value that equals some value in the extracted primary keys from `T1`.

A linker is equivalent to a combination of one <node-type type="constants-generator"/> and one <node-type type="attribute-filter"/>,
where the constants generator extracts the primary keys from `T1` that are used to filter `T2`.
Using a linker may simply diagram connections.

## Options
### Extract Column
Configures the column from which the primary keys are extracted.
The column is from the first table `T1` that is connected to the first <port-type type="input"/>.

### Filter Column
Configures the column on which filtering is applied on the second table `T2` that is connected to the second <port-type type="input"/>.
The filtering matches the attribute values in this column against the primary keys extracted from `T1` using <ui-value text="Full String"/> matching.
