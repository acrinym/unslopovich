"use strict";

// Static XAML leads only. Work with quoted attributes, not arbitrary text or
// binding expressions. Inspect the default namespace before applying UI rules.
function* tags(code) {
  const markup = /<(\/?)([A-Za-z_][\w.:-]*)(?=[\s/>])((?:"[^"]*"|'[^']*'|[^'"<>])*)>/g;
  const namespaces = [];
  for (const m of code.matchAll(markup)) {
    if (m[1]) {
      namespaces.pop();
      continue;
    }
    const attributes = new Map();
    const base = m.index + 1 + m[2].length;
    for (const a of m[3].matchAll(/(?:^|\s)([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attributes.set(a[1], { value: a[2] ?? a[3], index: base + a.index + a[0].indexOf(a[1]) });
    }
    const namespace = attributes.get("xmlns")?.value ?? namespaces[namespaces.length - 1];
    if (!m[3].trimEnd().endsWith("/")) namespaces.push(namespace);
    yield { name: m[2], attributes, namespace };
  }
}

function xamlDialect(code) {
  const root = tags(code).next().value;
  const ns = root?.namespace;
  if (ns === "https://github.com/avaloniaui") return "avalonia";
  if (ns === "http://schemas.microsoft.com/winfx/2006/xaml/presentation") return "presentation";
  return null;
}

const interactive = new Set(["Button", "ToggleButton", "RepeatButton", "CheckBox", "RadioButton",
  "TextBox", "PasswordBox", "ComboBox", "Slider", "ListBox", "ListView", "TreeView", "DataGrid"]);
const lists = new Set(["ListBox", "ListView", "TreeView", "DataGrid", "ItemsControl"]);
const buttons = new Set(["Button", "ToggleButton", "RepeatButton"]);

function attributeHits(code, controls, names, predicate) {
  const hits = [];
  let rootNamespace;
  for (const { name, attributes, namespace } of tags(code)) {
    rootNamespace ??= namespace;
    if (!controls.has(name) || namespace !== rootNamespace) continue;
    for (const key of names) {
      const attr = attributes.get(key);
      if (attr && predicate(attr.value.trim(), name)) hits.push(attr.index);
    }
  }
  return hits;
}

const falsy = (value) => /^false$/i.test(value);
const xamlRules = [
  {
    id: "xaml-focus-disabled",
    family: "accessibility",
    severity: "noticeable",
    stacks: ["xaml"],
    message: "An interactive control explicitly cannot receive focus.",
    fix: "Check whether keyboard users can reach and operate this control. Restore focus unless an equivalent keyboard interaction is intentional.",
    find: ({ code }) => attributeHits(code, interactive, ["Focusable"], falsy),
  },
  {
    id: "xaml-tab-stop-disabled",
    family: "accessibility",
    severity: "noticeable",
    stacks: ["xaml"],
    message: "An interactive control is explicitly removed from tab navigation.",
    fix: "Check the complete keyboard traversal. Restore the tab stop for independently operated controls; preserve intentional composite-control navigation.",
    find: ({ code }) => attributeHits(code, interactive, ["IsTabStop", "KeyboardNavigation.IsTabStop"], falsy),
  },
  {
    id: "xaml-focus-visual-removed",
    family: "accessibility",
    severity: "noticeable",
    stacks: ["xaml"],
    message: "The default keyboard focus visual is explicitly cleared.",
    fix: "Verify a visible custom focus indicator in the running app or restore the platform focus visual.",
    find: ({ code, dialect }) => attributeHits(code, interactive,
      [dialect === "avalonia" ? "FocusAdorner" : "FocusVisualStyle"],
      (value) => /^\{x:Null\s*\}$/.test(value)),
  },
  {
    id: "xaml-virtualization-disabled",
    family: "performance",
    severity: "noticeable",
    stacks: ["xaml"],
    message: "UI virtualization is explicitly disabled on an items control.",
    fix: "Check the item count and profile scrolling; restore virtualization if large collections do not require a nonvirtualizing layout.",
    find({ code, dialect }) {
      if (dialect !== "presentation") return [];
      return [
        ...attributeHits(code, lists, ["VirtualizingPanel.IsVirtualizing", "VirtualizingStackPanel.IsVirtualizing"], falsy),
        ...attributeHits(code, new Set(["DataGrid"]), ["EnableRowVirtualization"], falsy),
      ];
    },
  },
  {
    id: "xaml-vague-button",
    family: "copy",
    severity: "minor",
    stacks: ["xaml"],
    message: "Button content does not identify its action.",
    fix: "Use an action and object, such as Save settings or Send invoice.",
    find: ({ code }) => attributeHits(code, buttons, ["Content"], (value) => /^(?:Submit|Click here|Tap here)$/i.test(value)),
  },
];

module.exports = { xamlRules, xamlDialect };
