---
sidebarDepth: 0
---

# Shortcut

## Diagram Edit and Interaction
| <div class="table-spacer sm">Key</div> | <div class="table-spacer">Effect</div> |
|:-------------:|:-------------:|
| <shortcut-key :keys="['ctrl', 'Z']"/> | Undo |
| <shortcut-key :keys="['ctrl', 'shift', 'Z']"/> | Redo |
| <shortcut-key :keys="['ctrl', 'D']"/> | Remove selected node(s) |
| <shortcut-key :keys="['A']"/> | Quick node panel |
| <shortcut-key :keys="['shift', 'left click']" :hold="['shift']"/> | Select/deselect additional nodes on canvas |
| <shortcut-key :keys="['alt', 'drag']" :hold="['alt']"/> | Drag and move visualization |
| <shortcut-key :keys="['shift', 'drag']" :hold="['shift']"/> | Select additional data in visualization |

## Diagram Saving
| <div class="table-spacer sm">Key</div> | <div class="table-spacer">Effect</div> |
|:-------------:|:-------------:|
| <shortcut-key :keys="['ctrl', 'S']"/> | Save diagram |
| <shortcut-key :keys="['ctrl', 'shift', 'S']"/> | Save as diagram |
| <shortcut-key :keys="['ctrl', 'L']"/> | Load diagram |
| <shortcut-key :keys="['ctrl', 'N']"/> | New diagram |

## FlowSense
| <div class="table-spacer sm">Key</div> | <div class="table-spacer">Effect</div> |
|:-------------:|:-------------:|
| <shortcut-key :keys="['shift', 'S']"/> | Open FlowSense input |
