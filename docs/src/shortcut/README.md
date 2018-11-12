---
sidebarDepth: 0
---

# Shortcut

## Diagram Editing
| <div class="table-spacer sm">Key</div> | <div class="table-spacer">Effect</div> |
|:-------------:|:-------------:|
| <shortcut-key :keys="['ctrl', 'Z']"></shortcut-key> | Undo |
| <shortcut-key :keys="['ctrl', 'shift', 'Z']"></shortcut-key> | Redo |
| <shortcut-key :keys="['shift']" :hold="['shift']"></shortcut-key> | Select multiple nodes |
| <shortcut-key :keys="['alt']" :hold="['alt']"></shortcut-key> | Drag visualization (instead of select data points) |
| <shortcut-key :keys="['A']"></shortcut-key> | Quick node panel |


## Diagram Saving
| <div class="table-spacer sm">Key</div> | <div class="table-spacer">Effect</div> |
|:-------------:|:-------------:|
| <shortcut-key :keys="['ctrl', 'S']"></shortcut-key> | Save diagram |
| <shortcut-key :keys="['ctrl', 'shift', 'S']"></shortcut-key> | Save as diagram |
| <shortcut-key :keys="['ctrl', 'L']"></shortcut-key> | Load diagram |
| <shortcut-key :keys="['ctrl', 'N']"></shortcut-key> | New diagram |

## Data Selection in Visualization
| <div class="table-spacer sm">Key</div> | <div class="table-spacer">Effect</div> |
|:-------------:|:-------------:|
| <shortcut-key :keys="['shift']" :hold="['shift']"></shortcut-key> | Add new selection to the existing selection |

## FlowSense
| <div class="table-spacer sm">Key</div> | <div class="table-spacer">Effect</div> |
|:-------------:|:-------------:|
| <shortcut-key :keys="['shift', 'S']"></shortcut-key> | FlowSense input |
