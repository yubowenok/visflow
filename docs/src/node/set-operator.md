# Set Operator

A <node-type type="set-operator"/> supports set operation between two subsets from a same input table.
There are three modes for a set operator: <ui-value text="Union"/>, <ui-value text="Intersection"/>, and <ui-value text="Difference"/>.


## Connection Order
The <port-type type="multi-input"/> of the set operator accepts multiple connections.
The first connected edge provides subset `S1`, the second connected edge provides the subset `S2`, and so on.

## Union
In <ui-value text="Union"/> mode, the set operator outputs the union of all input subsets.
The visual properties of the data items are merged, when a same data item carries different visual properties from two subsets.
In case of a conflict, the latter connected subsets have higher priority.

## Intersection
In <ui-value text="Intersection"/> mode, the set operator outputs the intersection of all input subsets.
The visual properites of the data items in the intersection are merged when they carry different visual properties from multiple subsets.
In case of a conflict, the latter connected subsets have higher priority.

## Difference
In <ui-value text="Intersection"/> mode, the set operator subtracts `S2`, `S3`, ... from `S1` and outputs the resulting subset.
The visual properties associated with `S1` are kept as the visual properties for the output subset.

## Options
### Mode
Configures the mode of the set operator, from <ui-value text="Union"/>, <ui-value text="Intersection"/>, and <ui-value text="Difference"/>.
