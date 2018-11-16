# Attribute Filter
An <node-type type="attribute-filter"/> examines attribute values of data items and perform attribute filtering.

## Filter Types
An attribute filter works in one of the four types.
The filter type can be configured via <ui-prop node-type="attribute-filter" prop="filter-type"/>.
For all filter types, <ui-prop node-type="attribute-filter" prop="column"/> must be specified.
Filtering is based on attribute values from that column.

### Pattern Filter
A pattern filter keeps the data items that match the given patterns.
Each pattern is a string or a regular expression.
Choose a <ui-prop prop="mode"/> to define how patterns are matched against:

### Range Filter
A range filter keeps the data items that have an attribute value within a given range.
Specify the range using <ui-prop prop="min"/> and <ui-prop prop="max"/>.

Range endpoints may be giving using constants input.
The first constant is used as <ui-prop prop="min"/>,
and the second is used as <ui-prop prop="max"/>.
The remaining constants have no effect.

### Extremum Filter
An extremum filter finds the data items that have the maximum or minimum value(s) in the filtered column.
Use <ui-prop prop="criterion"/> to choose from a <ui-value text="Maximum"/> or a <ui-value text="Minimum"/> filter.

See <ui-prop prop="amount-type"/>, <ui-prop prop="amount"/>,
<ui-prop prop="group-by-column"/> and <ui-prop prop="distinct-values"/> for other configurations related to extremum filter.

### Sampling
A sampling filter samples the data items.
Sampling can either reduce the amount of data to a fixed <ui-prop prop="count"/> or a certain <ui-prop prop="percentage"/>.

See <ui-prop prop="amount-type"/>, <ui-prop prop="amount"/>,
<ui-prop prop="group-by-column"/>, and <ui-prop prop="distinct-values"/> for other configurations related to sampling filter.

## Comparator
The attribute filter chooses a comparator automatically based on the column type of the input data.
Strings are compared by lexicographical order.
Dates are compared by their POSIX values.
Otherwise a numerical comparator is used.

A pattern filter always converts values to strings and uses string comparators.


## Options

### Filter Type
Configures the filter type used.
See [filter types](#filter-types).

### Column
Configures the column on which filtering is applied.

### Mode (Pattern Filter)
Configures the filter mode that defines how attribute values are matched against patterns.

| Mode | Filtering Condition |
|:---:| --- |
| <ui-value text="Substring"/> | The attribute value contains the pattern as a substring |
| <ui-value text="Full String"/> | The attribute value equals the pattern |
| <ui-value text="Regular Expression"/> | The pattern as a regular expression matches the attribute value |


### Amount Type
If <ui-prop prop="amount-type"/> is <ui-value text="Count"/>, a <ui-value text="Count"/> number of data items with extremum values are kept.
If <ui-prop prop="amount-type"/> is <ui-value text="Percentage"/>, a <ui-value text="Percentage"/> percent of data items with extremum values are kept.

### Amount
The number of data items to keep based on the <ui-prop prop="amount-type"/> given.

### Group By Column
If <ui-prop prop="group-by-column"/> is given, data items are first grouped based on their attribute values.
Filtering is then applied on each group separately.

### Distinct Values
If <ui-prop prop="distinct-values"/> is set, count and percentage are calculated only based on distinct values.
For example, if <ui-prop prop="count"/> is `1` for a maximum filter, all data items with the maximum value will be kept.
