# Interactive REST

## Abstract

Usually APIs return a response quickly, but sometimes processing can take a long time, and would be nice to have a visual feedback on what is happenning at the server-side.

## Experiment

This example project uses Pusher API to provide update during long running API operation.

1. Generate request ID
2. Subscribe to Pusher events for this ID
3. Invoke API endpoint
4. API endpoint generates events and sends them over [Pusher](https://pusher.com/), AWS SNS, Replicache or other event message API
5. Client side receives events
6. Show progress (messages or progress bar)
7. Receive response

**NOTE: This is a Proof of concept. See server-side code in [src/api/ping.js](src/api/ping.js) and client side code in [src/pages/EventBus.jsx](src/pages/EventBus.jsx)**

### Features

- More responsive UI
- Serverless compatible

### Drawbacks

- Increased complexity
- Adds another service into the mix
- No guaranteed delivery (some events might not be delivered, delivered out of order, delivered twice, just your normal async problems)

### Queue implementation

The same approach can be implemented in a queue processing (for a longer/more expensive task). Task can notify all subscribes about it current progress by sending events with a correlation ID.

### Todo

- FIXME: Processing uploaded file?
