# Comprehensive Code Review

Perform a multi-concern review of the current changes.

## Review Dimensions:

### 1. Design System Compliance
- Token usage for colors, spacing, typography
- 8pt grid adherence
- Component pattern consistency

### 2. Accessibility
- WCAG 2.2 AA compliance
- Screen reader support
- Touch target sizes

### 3. Performance
- Unnecessary re-renders
- Proper memoization
- List optimization

### 4. Security
- Input validation
- Data sanitization
- Secure storage usage

### 5. Code Quality
- TypeScript strictness
- Error handling
- Test coverage

## Output Format:
For each dimension, provide:
- Score (1-10)
- Issues found
- Specific fixes required
- Blocking vs non-blocking classification
