# Interactive REST

## Abstract

Traditionally APIs return response fast, but sometimes processing can take long time, and would be nice to have visual feedback on what is happenning at the server-side.

## Experiment

This example project uses Pusher API to provide update during long running API operation.

1. Generate request ID
2. Subscribe to Pusher events for this ID
3. Invoke API endpoint
4. API endpoint generates events and sends them over [Pusher](https://pusher.com/), AWS SNS, Replicache or other event message API
5. Client side receives events
6. Show progress (messages or progress bar)
7. Receive response

Obviously this is just for experimentation purposes. Currently, client side is subscribed to all events and filters them on the client side.

### Features

- Serverless compatible
- More responsive UI

### Drawbacks

- Increased complexity
- Adds another service into the mix
- There is no guaranteed delivery (some events, particularly at the start and the end, might not be delivered at all, delivered out of order, delivered twice, just your normal async problems)

### Queue implementation

The same approach can be implemented in queue processing. Task can notify all subscribes about it current progress by sending events with a correlation ID.

### Unresolved

FIXME: Processing uploaded file?
