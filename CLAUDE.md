NON NEGOTIABLE: Create comments that explain why, not the what. Do not over comment, just when it's strictly necessary.

## General rules

### Prefer decoding using arktype

When interacting with unsafe data types, prefer use Arktype to narrow down data.

#### Incorrect

```typescript
declare const bar: unknown
const foo = bar as string
```

#### Correct

```typescript
const Bar = type('string')

declare const bar: unknown

const foo = Bar(bar)

if (foo instanceof type.errors) {
  setError('MaybeFoo must be a string')

  return
}
```

### Prefer bail out

Whenever using if, prefer bail out in the opposite condition to make code more linear

#### Incorrect

```typescript
if (foo) {
  bar()
}
```

### Correct

```typescript
if (!foo) {
  return
}

bar()
```

### Padding between in TypeScript and JavaScript files

Padding between lines should be applied to let the code be more readeable.

#### Incorrect

```typescript
console.log('foo)
const foo = 'bar'
function Foo() {
  const bar = () => {
    const zoom = 'bar'
    return zoom
  }
  return bar()
}
```

#### Correct

```typescript
console.log('foo)

const foo = 'bar'

function Foo() {
  const bar = () => {
    const zoom = 'bar'

    return zoom
  }

  return bar()
}
```

### Prefer arrow functions for components

#### Bad

```typescript
function Component() {
  return (
    <div>bar</div>
  )
}

function Component() {
  const memoizedValue = useMemo(() => 'bar', [])

  return (
    <div>{memoizedValue}</div>
  )
}
```

#### Correct

```typescript
const Component = () => <div>bar</div>

const Component = () => {
  const memoizedValue = useMemo(() => 'bar', [])

  return (
    <div>{memoizedValue}</div>
  )
}
```

### Prefer separated Component's props definition

#### Bad

```typescript
const Component = (props: { foo: string; bar: number }) => {
  ...
}
```

#### Correct

```typescript
interface Props {
  foo: string
  bar: number
}

const Component = (props: Props) => {
  ...
}
```
