# Git Hooks

## Pre-push Security Scan

The `pre-push` hook runs the security scanner before allowing a push, blocking pushes with high-severity flags.

### Enable the hook

Run this once to activate all hooks in this directory:
```
git config core.hooksPath tools/hub/hooks
```

### Skip the hook once

To push without running the hook:
```
git push --no-verify
```
