---
name: perf-audit
description: Audit React Native performance, memory, and startup time
---

Comprehensive performance audit for React Native app.

## Workflow

1. **Delegate to `performance` droid**
2. **Analyze bundle size**
3. **Check for re-render issues**
4. **Audit memory management**
5. **Review battery impact**

## Checks Performed

### Bundle Analysis
```bash
# Check bundle size
npx expo export --platform ios 2>/dev/null
# Or estimate from node_modules
du -sh node_modules/
```

### Re-render Detection
Scan for common anti-patterns:
- Inline arrow functions in JSX props
- Missing useCallback/useMemo
- Missing React.memo on list items
- Context value object recreation
- Unnecessary state updates

### Memory Management
Check for:
- useEffect cleanup functions
- Event listener cleanup
- Timer cleanup (setTimeout, setInterval)
- Subscription cleanup
- Animation cleanup

### List Performance
Verify:
- FlashList usage for long lists (>20 items)
- Proper keyExtractor
- estimatedItemSize prop
- React.memo on item components

### Battery Impact
Review:
- GPS polling frequency
- Weather API call frequency
- Sensor polling intervals
- Background task efficiency

## Files to Check
```
src/app/_layout.tsx
src/providers/
src/features/*/screens/*.tsx
src/core/components/
src/hooks/
```

## Benchmarks

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Cold start | < 3s | Manual timing |
| Bundle size | < 50MB | `npx expo export` |
| Memory | < 200MB | Xcode Instruments |
| FPS | 60 | React DevTools |

## Output Format

```markdown
# Performance Audit - [Date]

## Summary
| Metric | Target | Status |
|--------|--------|--------|
| Bundle size | < 50MB | ✅/❌ [X]MB |
| Re-render issues | 0 | ✅/❌ [X] found |
| Memory leaks | 0 | ✅/❌ [X] found |
| FlashList usage | 100% | ✅/❌ [X]% |

## Re-render Issues
| Component | Issue | Fix |
|-----------|-------|-----|
| [name] | [inline fn] | useCallback |
| [name] | [missing memo] | React.memo |

## Memory Issues
| Location | Issue | Fix |
|----------|-------|-----|
| [file:line] | [missing cleanup] | Add return fn |

## Battery Concerns
| Feature | Current | Recommended |
|---------|---------|-------------|
| GPS | [interval] | [recommendation] |
| Weather | [interval] | [recommendation] |

## Priority Fixes
1. [Highest impact fix]
2. [Second priority]
3. [Third priority]

## Score
Performance Score: [X]/100
```

## Usage
```
/perf-audit                 # Full audit
/perf-audit --rerenders     # Focus on re-renders
/perf-audit --memory        # Focus on memory
/perf-audit --bundle        # Focus on bundle size
```
