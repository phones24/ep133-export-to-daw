# EP133 Tool Agent Guidelines

## Build/Test Commands
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm run lint` - Run Biome linter
- `pnpm run format` - Format code with Biome

## Code Style
- **Formatter**: Biome with tab indentation
- **Quotes**: Single quotes for JavaScript/TypeScript
- **Imports**: Organize imports automatically (Biome assist)
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Error Handling**: Custom error classes with descriptive names and messages
- **Documentation**: JSDoc for functions with param descriptions
- **Types**: Use TypeScript for type annotations
- **TypeScript**:
  - Prefer interfaces for public APIs and object shapes
  - Use strict type checking
  - Use explicit return types for functions
- **Preact**:
  - Use function components with hooks
  - Keep components small and focused on a single responsibility
  - Type props with interfaces and make props optional when possible
  - Use named exports for components
- **Class Structure**:
  - Descriptive constructor parameters
  - Clear method organization
  - Proper error handling with custom errors
- **Project Structure**:
  - `/src` - Main source code
  - `/src/ep133` - Core functionality modules
  - `/src/lib` - Utility functions
  - `/src/components` - Preact components
