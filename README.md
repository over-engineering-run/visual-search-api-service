# event store cli

```
APPEND EVENT <some-event>
TO <some-stream>
WITH ( id=1, value='some value' )
```

```typescript
const event = jsonEvent({
  type: "some-event",
  data: {
    id: 1,
    value: "some value",
  },
});
```
