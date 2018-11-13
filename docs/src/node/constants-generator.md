# Constants Generator

A <node-type type="constants-generator"/> produces a list of <page-link link="/dataflow/constants" text="Constants"/> at its output <port-type type="constants"/>.

Constants can be entered either manually, or extracted from the input table.
If the <port-type type="input"/> is connected,
the constants generator extracts the attribute values of the data items in the given <ui-prop prop="column"/>.
If there is no input, a list of constants can be specified manually in the option panel.

Extracted constants can be used to filter data items.
For example, if we extract the <ui-value text="model.year"/> values for a subset of cars, we can use those year constants to find the cars that were built in the same year(s).

Extracted constants can also be used to link two heterogeneous tables that share a primary-key column.
Please see <page-link link="/dataflow/linking" text="Linking Heterogeneous Tables"/> and <node-type type="linker"/> for more details.

## Options
### Column
Configures a column from which the attribute values are extracted.
This can only be specified when the <port-type type="input"/> is connected.

### Distinct Constants
Configures the constants generator to only extract distinct constant values.

### Sort Constants
Configures the constants generator to output the extracted constant values in sorted order.
