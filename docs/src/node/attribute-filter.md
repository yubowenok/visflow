# Attribute Filter
An <node-type type="attribute-filter"></node-type> examines attribute values of data items and perform attribute filtering.

## Filter Types
An attribute filter works in one of the four types.
The filter type can be configured via <ui-prop node-type="attribute-filter" prop="filter-type">Filter Type</ui-prop>.
For all filter types, <ui-prop node-type="attribute-filter" prop="column">Column</ui-prop> must be specified.
Filtering is based on attribute values from that column.

### Pattern Filter
A pattern filter keeps the data items that match the given patterns.
Each pattern is a string or a regular expression.
Choose a <ui-prop prop="mode">Mode</ui-prop> to define how patterns are matched against:

### Range Filter
A range filter keeps the data items that have an attribute value within a given range.
Specify the range using <ui-prop>Min</ui-prop> and <ui-prop>Max</ui-prop>.

Range endpoints may be giving using constants input.
The first constant is used as <ui-prop>Min</ui-prop>,
and the second is used as <ui-prop>Max</ui-prop>.
The remaining constants have no effect.

### Extremum Filter
An extremum filter finds the data items that have the maximum or minimum value(s) in the filtered column.
Use <ui-prop>Criterion</ui-prop> to choose from a <ui-value>Maixmum</ui-value> or a <ui-value>Minimum</ui-value> filter.

See <ui-prop prop="amount-type">Amount Type</ui-prop>, <ui-prop prop="Amount">Amount</ui-prop>,
<ui-prop prop="group-by-column">Group By Column</ui-prop>, and <ui-prop prop="distinct-values">Distinct Values</ui-prop> for other configurations related to extremum filter.

### Sampling
A sampling filter samples the data items.
Sampling can either reduce the amount of data to a fixed <ui-prop>Count</ui-prop> or a certain <ui-prop>Percentage</ui-prop>.

See <ui-prop prop="amount-type">Amount Type</ui-prop>, <ui-prop prop="Amount">Amount</ui-prop>,
<ui-prop prop="group-by-column">Group By Column</ui-prop>, and <ui-prop prop="distinct-values">Distinct Values</ui-prop> for other configurations related to sampling filter.

## Comparator
The attribute filter chooses a comparator automatically based on the column type of the input data.
Strings are compared by lexicographical order.
Dates are compared by their POSIX values.
Otherwise a numerical comparator is used.

A pattern filter always converts values to strings and uses string comparators.


## Options

### Filter Type
The filter type used.
See [filter types](#filter-types).

### Column
The column on which filtering is applied.

### Mode (Pattern Filter)
Mode defines how attribute values are matched against patterns.

| Mode | Filtering Condition |
|:---:| --- |
| <ui-value>Substring</ui-value> | The attribute value contains the pattern as a substring |
| <ui-value>Full String</ui-value>| The attribute value equals the pattern |
| <ui-value>Regular Expression</ui-value> | The pattern as a regular expression matches the attribute value |


### Amount Type
If <ui-prop>Amount Type</ui-prop> is <ui-value>Count</ui-value>, a <ui-value>Count</ui-value> number of data items with extremum values are kept.
If <ui-prop>Amount Type</ui-prop> is <ui-value>Percentage</ui-value>, a <ui-value>Percentage</ui-value> percent of data items with extremum values are kept.

### Amount
The number of data items to keep based on the <ui-prop>Amount Type</ui-prop> given.

### Group By Column
If <ui-prop>Group By Column</ui-prop> is given, data items are first grouped based on their attribute values.
Filtering is then applied on each group separately.

### Distinct Values
If <ui-prop>Distinct Values</ui-prop> is set, count and percentage are calculated only based on distinct values.
For example, if <ui-prop>Count</ui-prop> is <ui-value>1</ui-value> for a maximum filter, all data items with the maximum value will be kept.
