# Set Operator

## Union
Unifies the input subsets.

The Union node accepts multiple inputs. The rendering properties of the inputs will be combined. The latter connected input will override the previously connected inputs' rendering properties upon a conflict.


## Intersection
Outputs the intersection of the input subsets.

The Intersect node accepts multiple inputs. The rendering properties of the inputs will be combined for the items in the intersection. The latter connected input will override the previously connected inputs' rendering properties upon a conflict.


## Difference
Subtracts the input subset(s) Y from the input subset X.

The subset to be subtracted from, i.e. X, may only be one subset, while the other subsets Y's can be multiple subsets Y1, Y2, ..., Yn, in which case the output subset is X - Y1 - Y2 - ... - Yn.

The rendering properties associated with X will be used for the output rendering properties.
