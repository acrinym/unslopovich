# Desktop: Avalonia and WPF

Use this guide for native desktop applications written in XAML/AXAML.
Start from the user's real task, not a mobile layout checklist.

- Keyboard: tab and shift-tab through the task, check Enter/Space, shortcuts,
  focus restoration after dialogs, visible focus, and keyboard alternatives.
  Intentional composite controls (toolbars and grids) may use arrow-key navigation.
- Accessibility: inspect the platform automation tree, accessible names for
  icon-only controls, label associations, contrast, and text/display scaling.
- Layout: resize windows, change display scaling, move between monitors, and
  inspect long labels and scrolling without assuming a mobile viewport.
- Responsiveness: profile long lists, startup and long-running commands.
  Avoid blocking the UI thread; verify loading, cancellation and error states.
- Truth: exercise the actual command and confirm its result, not just its label.
  A binding or a declared command is not proof that an action works.

The dependency-free detector checks explicit focus and tab-stop opt-outs,
cleared default focus visuals, explicit WPF virtualization opt-outs, and vague
button Content labels. It scans recognized default XAML namespaces and reports
leads, not resolved styles, accessibility trees, runtime or C# binding correctness.
Inspect custom styles and templates before treating a focus-related hit.
It does not claim support for every XAML dialect, prefix mapping or markup
extension. Avalonia uses its own virtualization model; WPF-specific checks
do not apply to AXAML.

References:
- [Avalonia focus](https://docs.avaloniaui.net/docs/input-interaction/focus)
- [Avalonia accessibility](https://docs.avaloniaui.net/docs/app-development/accessibility)
- [WPF focus visuals](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/styling-for-focus-in-controls-and-focusvisualstyle)
- [WPF control performance](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/optimizing-performance-controls)
