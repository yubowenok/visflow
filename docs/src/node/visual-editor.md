# Visual Editor

A <node-type type="visual-editor"/> associates [visual properties](/dataflow/diagram.html#visual-property) to the data items.
It works in one of the two ways: <ui-value text="Assignment"/> and <ui-value text="Encoding"/>.

## Assignment
In <ui-value text="Assignment"/> mode, the visual editor sets the given visual properties of its input and overrides all previously set values.

## Encoding
In <ui-value text="Encoding"/> mode, the visual editor assigns one type of visual property based on the attribute values of the data items using a scale.
A color scale is applied when the visual property is of a color type.
Otherwise a numerical scale is applied.

## Options
### Mode
Configures the mode of the visual editor, from <ui-value text="Assignment"/> and <ui-value text="Encoding"/>.

### Assignment Mode Options
Assigns given visual properties to the data items.
The supported visual properties are <ui-value text="color"/>, <ui-value text="border"/>, <ui-value text="size"/>, <ui-value text="width"/>, and <ui-value text="opacity"/>.

### Encoding Mode Options
#### Column
Configures the column on which the scale is applied.

#### Type
Configures the visual property the encoding maps attribute values to.

#### Scale
Configures the color scale of the encoding mapping when the selected <ui-prop prop="type"/> is a color property <ui-value text="color"/> or <ui-value text="border"/>.
The dropdown shows a list of supported color scales.

#### Min & Max
Configures a numerical scale of the encoding mapping when the selected <ui-prop prop="type"/> is a numerical property <ui-value text="size"/>, <ui-value text="width"/>, or <ui-value text="opacity"/>.
The minimum attribute value is mapped to <ui-prop prop="min-max" text="Min"/>, and the maximum attribute value is mapped to <ui-prop prop="min-max" text="Max"/>.
Both <ui-prop prop="min-max" text="Min"/> and <ui-prop prop="min-max" text="Max"/> are required.
