<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Obliqo uses route-specific pages and one frontend mock service/store with session-scoped browser persistence; this keeps all views consistent across navigation without adding a backend and allows future FastAPI replacement.
- The demo uses September 30, 2026 as its fixed reference date so the supplied example deadlines and relative labels agree.
