# Contributing to Nodegram

Thank you for your interest in contributing to Nodegram! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (browser, OS, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use case and motivation
   - Potential implementation approach (if you have ideas)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**:
   - Follow the project's code style
   - Write or update tests if applicable
   - Update documentation as needed

4. **Commit your changes**:
   ```bash
   git commit -m "feat: add your feature description"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Provide a clear title and description
   - Reference any related issues
   - Wait for code review

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a branch for your changes
4. Make your changes
5. Run linting: `npm run lint`
6. Run type checking: `npm run type-check`
7. Format code: `npm run format`
8. Test your changes locally

## Code Style

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper types or `unknown`
- Use interfaces for object types
- Prefer type inference where possible

### React

- Use functional components with hooks
- Follow FSD architecture principles
- Keep components small and focused
- Use meaningful prop and variable names

### Naming Conventions

- Components: PascalCase (e.g., `NodeGraph.tsx`)
- Files: camelCase for utilities, PascalCase for components
- Variables and functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

### File Structure

Follow FSD architecture:
- Place components in appropriate layers
- Use index files for public API
- Keep related files together

### Comments

- Write comments in English
- Explain "why", not "what"
- Use JSDoc for public APIs

## Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for good test coverage

## Documentation

- Update README.md if needed
- Add JSDoc comments for public APIs
- Update CHANGELOG.md for user-facing changes

## Review Process

1. All PRs require at least one approval
2. Address review comments promptly
3. Keep PRs focused and reasonably sized
4. Respond to feedback constructively

## Questions?

Feel free to open an issue for questions or reach out to maintainers.

Thank you for contributing to Nodegram! 🎉

