# Flow Engine

The Flow Engine provides comprehensive flow management capabilities for FlowRunner, including flow creation, screen sequence management, navigation graphs, and theme consistency.

## Overview

The Flow Engine consists of several modules:

- **Engine** (`engine.ts`): Core flow operations (CRUD, cloning, querying)
- **Screen Sequence** (`screen-sequence.ts`): Screen ordering, insertion, removal, reordering
- **Navigation Graph** (`navigation-graph.ts`): Navigation path management and validation
- **Theme Consistency** (`theme-consistency.ts`): Palette and vibe consistency across screens
- **Flow Context** (`flow-context.tsx`): React context for client-side flow state management

## Core Concepts

### Flow
A flow is a collection of screens that form a complete user journey. Each flow has:
- Metadata (name, description, domain, theme, style)
- Screen sequence
- Navigation graph
- Theme configuration

### Screen Sequence
Screens in a flow are ordered and can have parent-child relationships. The sequence determines the default order of screens.

### Navigation Graph
The navigation graph defines how users can move between screens. It includes:
- Entry screen (first screen in the flow)
- Navigation paths (from one screen to another)
- Navigation triggers (button-click, form-submit, etc.)

### Theme Consistency
Flows can maintain consistent palettes and vibes across all screens. The theme config allows:
- Primary palette to apply across screens
- Primary vibe to maintain consistency
- Variation tolerance (strict, moderate, loose)

## Usage

### Server-Side (API/Server Components)

```typescript
import { FlowEngine } from '@/lib/flows'
import { getScreenSequence, insertScreen } from '@/lib/flows'

// Create a flow
const flow = await FlowEngine.createFlow({
  name: 'My Flow',
  description: 'A sample flow',
  domain: 'ecommerce',
  initialScreens: [screenDSL1, screenDSL2],
})

// Get flow with screens
const flowWithScreens = await FlowEngine.getFlow(flowId, true)

// Insert a screen
await insertScreen(flowId, {
  screenDSL: newScreenDSL,
  position: 'end',
  navigationFrom: previousScreenId,
})

// Get screen sequence
const sequence = await getScreenSequence(flowId)
```

### Client-Side (React Components)

```typescript
'use client'

import { FlowProvider, useFlow } from '@/lib/flows'

function MyComponent() {
  const { currentFlow, screens, loadFlow, insertScreen } = useFlow()

  useEffect(() => {
    loadFlow(flowId)
  }, [flowId])

  const handleAddScreen = async () => {
    await insertScreen(flowId, {
      screenDSL: newScreenDSL,
      position: 'end',
    })
  }

  return (
    <div>
      <h1>{currentFlow?.name}</h1>
      {/* Render screens */}
    </div>
  )
}

// Wrap your app with FlowProvider
function App() {
  return (
    <FlowProvider>
      <MyComponent />
    </FlowProvider>
  )
}
```

## API Endpoints

### Flows

- `GET /api/flows` - Query flows with filters
- `POST /api/flows` - Create a new flow
- `GET /api/flows/[flowId]` - Get flow by ID
- `PUT /api/flows/[flowId]` - Update flow
- `DELETE /api/flows/[flowId]` - Delete flow
- `POST /api/flows/[flowId]/clone` - Clone flow
- `GET /api/flows/[flowId]/stats` - Get flow statistics

### Screens

- `GET /api/flows/[flowId]/screens` - Get all screens in a flow
- `POST /api/flows/[flowId]/screens` - Insert a new screen
- `DELETE /api/flows/[flowId]/screens/[screenId]` - Remove a screen

### Navigation

- `GET /api/flows/[flowId]/navigation` - Get navigation graph
- `POST /api/flows/[flowId]/navigation` - Add navigation path
- `DELETE /api/flows/[flowId]/navigation` - Remove navigation path

## Flow Engine Methods

### FlowEngine

- `createFlow(options)` - Create a new flow
- `getFlow(flowId, includeScreens)` - Get flow by ID
- `updateFlow(flowId, options)` - Update flow metadata
- `deleteFlow(flowId)` - Delete flow
- `cloneFlow(flowId, options)` - Clone a flow
- `queryFlows(options)` - Query flows with filters
- `getFlowStats(flowId)` - Get flow statistics

### Screen Sequence

- `getScreenSequence(flowId)` - Get screen sequence with relationships
- `insertScreen(flowId, options)` - Insert a screen
- `removeScreen(flowId, screenId)` - Remove a screen
- `reorderScreen(flowId, options)` - Reorder screens
- `getOrderedScreens(flowId)` - Get screens in order

### Navigation Graph

- `buildNavigationGraph(flowId)` - Build navigation graph
- `addNavigationPath(flowId, fromScreenId, toScreenId, options)` - Add navigation path
- `removeNavigationPath(flowId, fromScreenId)` - Remove navigation path
- `validateNavigationGraph(flowId)` - Validate for cycles
- `getNavigationPath(flowId, fromScreenId, toScreenId)` - Get path between screens

### Theme Consistency

- `calculateFlowConsistency(flowId)` - Calculate consistency scores
- `applyThemeToScreen(screenDSL, themeConfig)` - Apply theme to screen
- `validateScreenTheme(screenDSL, themeConfig)` - Validate screen against theme
- `getFlowThemeConfig(flowId)` - Get flow theme config

## Type Definitions

See `types.ts` for complete type definitions including:
- `FlowMetadata`
- `ScreenSequenceEntry`
- `FlowNavigationGraph`
- `FlowThemeConfig`
- `CreateFlowOptions`
- `UpdateFlowOptions`
- `InsertScreenOptions`
- `ReorderScreenOptions`
- `CloneFlowOptions`
- `FlowQueryOptions`
- `FlowStats`

## Notes

- Flow metadata (including theme config) is currently stored in the first screen's metadata as a workaround. In production, add a `metadata` field to the Flow model.
- SQLite doesn't support case-insensitive search, so search queries are case-sensitive.
- Screen ordering uses `createdAt` by default, with optional `order` field in metadata for custom ordering.

