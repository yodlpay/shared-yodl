# Shared YODL Module

This is a shared module for the YODL project that can be used as a Git submodule in both frontend and backend projects.

## Installation

To use this module in your frontend or backend project:

1. Add it as a Git submodule:

```bash
git submodule add <repository-url> shared-yodl
```

2. Install dependencies:

```bash
cd shared-yodl
npm install
```

3. Build the module:

```bash
npm run build
```

## Usage

Import the shared module in your frontend or backend code:

```typescript
import { SharedConfig, defaultConfig } from 'shared-yodl';

// Use the shared types and utilities
const config: SharedConfig = {
  ...defaultConfig,
  apiUrl: 'https://api.example.com',
};
```

## Development

1. Make changes to the source code in the `src` directory
2. Run `npm run build` to compile TypeScript to JavaScript
3. Commit and push your changes
4. Update the submodule reference in your frontend/backend projects:

```bash
git submodule update --remote
```
