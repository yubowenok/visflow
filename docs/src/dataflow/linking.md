# Linking

VisFlow works with heterogeneous data by _linking_.
Essentially, linking relates two heterogeneous tables by defining a primary key shared between the two tables.
Each table must have a column that contains the primary keys.
Linking can be achieved using a <node-type type="linker"/>.

To link two heterogenous tables `T1` and `T2`, one column must be chosen from the two tables as the shared primary-key column.
The corresponding rows in the two tables must have an equal value in the primary-key column.
The primary key values are extracted from `T1` and used to filter data items from `T2`.

For example, assume `T1` contains the mpg values of the cars:
| name | mpg |
|:---:|:---:|
| amc | 15 |
| buick | 14 |
| chevrolet | 18 |
| ... | ... |

Assume `T2` contains the sales number of the cars:
| car name | sales number |
|:---:|:---:|
| amc | 3 |
| buick | 2 |
| chevrolet | 4 |
| ... | ... |

The shared primary-key column is <ui-value text="name"/> from `T1` and <ui-value text="car name"/> from `T2`.

If we want to find the sales numbers for a subset of cars from `T1`, we can extract the <ui-value text="name"/> values of the `T1` subset into a list of constants, and then use these constants to filter and find the data items in `T2` that match these car names.
We can use a <node-type type="linker"/> for this purpose: set <ui-prop node-type="linker" prop="extract-column"/> to <ui-value text="name"/> from `T1` and <ui-prop node-type="linker" prop="filter-column"/> to <ui-value text="car name"/> from `T2`.
