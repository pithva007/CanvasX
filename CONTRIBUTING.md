# Contributing Guide

Thank you for your interest in contributing to DrawTogether!

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Bug Reports
1. Check if the bug has already been reported
2. Include:
   - Description of the bug
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/videos if applicable
   - Environment details (OS, browser, Node version)

### Feature Requests
1. Describe the feature
2. Explain the use case
3. Show examples if possible
4. Discuss potential implementation approaches

### Code Contributions

#### Setup Development Environment
```bash
# Clone and setup
git clone https://github.com/pithva007/Drawing.git
cd Drawing
npm install

# Start development servers
make dev-server   # Terminal 1
make dev-client   # Terminal 2
```

#### Making Changes
1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Test thoroughly
4. Write clear commit messages
5. Push to your fork
6. Create a Pull Request

#### Code Style

**JavaScript/JSX**
```javascript
// Use functional components with hooks
export function MyComponent() {
  const [state, setState] = useState(null)
  
  return <div>{state}</div>
}

// Use meaningful variable names
const userId = '123'  // Good
const uid = '123'     // Avoid

// Use constants for magic numbers
const MAX_USERS = 2   // Good
const 2 = maxUsers    // Avoid

// Add comments for complex logic
// Fetch room state if reconnected
useEffect(() => {
  socket.emit('room:get-state', {}, (state) => {
    updateState(state)
  })
}, [connected])
```

**Files & Folders**
- Use PascalCase for React components: `MyComponent.jsx`
- Use camelCase for utilities: `helpers.js`
- Use PascalCase for folders: `/components/`
- Use lowercase for config: `vite.config.js`

#### Commit Messages

```
feat: Add dark mode toggle
fix: Correct cursor sync issue
docs: Update API documentation
test: Add drawing tests
refactor: Simplify room manager logic
style: Format toolbar component
chore: Update dependencies
```

#### Testing

Before submitting a PR:
1. Test in development mode
2. Test with multiple users (2 browser windows)
3. Test disconnection/reconnection
4. Test in production build: `npm run build && npm run preview`
5. Test in different browsers (Chrome, Firefox, Safari)
6. Test on mobile devices

#### Performance

Check these before submitting:
- No unnecessary re-renders (React DevTools)
- No console errors or warnings
- Network requests are efficient
- Bundle size hasn't increased significantly
- Load time is acceptable

### Documentation

- Update README.md for user-facing changes
- Update API.md for API changes
- Update ARCHITECTURE.md for architecture changes
- Add inline comments for complex logic
- Update DEPLOYMENT.md for deployment changes

## PR Guidelines

1. **Title**: Clear, descriptive (40 chars or less)
2. **Description**: Explain what and why
3. **Linked Issues**: Reference related issues
4. **Screenshots**: Include for UI changes
5. **Checklist**:
   - [ ] Code follows style guidelines
   - [ ] Tested thoroughly
   - [ ] Documentation updated
   - [ ] No breaking changes

## Review Process

1. Code review for quality, security, performance
2. Tests pass
3. Documentation is complete
4. Conflicts resolved
5. Ready to merge

## Release Process

1. Update version in package.json (semantic versioning)
2. Update CHANGELOG.md
3. Create git tag
4. Deploy to production

## Getting Help

- Check existing documentation
- Search closed issues
- Ask in discussions
- Open an issue with detailed question

## Areas to Contribute

### High Priority
- [ ] Database integration (MongoDB)
- [ ] Authentication system
- [ ] Rate limiting
- [ ] Performance optimization
- [ ] Mobile responsiveness improvements

### Medium Priority
- [ ] PDF export
- [ ] Additional drawing tools
- [ ] Collaborative selections
- [ ] Comments/annotations
- [ ] Version history

### Nice to Have
- [ ] Custom brushes
- [ ] Drawing templates
- [ ] Collaboration permissions
- [ ] Team workspaces
- [ ] Analytics

## Development Tips

### Debug Socket.IO
```javascript
// In browser console
localStorage.debug = 'socket.io-client:socket'
```

### Debug React
- Use React DevTools extension
- Check component props and state
- Profile performance with DevTools

### Common Issues
- Port already in use: `lsof -i :3001`
- Module not found: `rm -rf node_modules && npm install`
- Build fails: Check for TypeScript errors

## Questions?

- Open a discussion
- Email: [contact info]
- Discord: [server link]

---

Thank you for contributing! 🙏
