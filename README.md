# Interactive REST

Tradint

Uses Pusher API to provide update during long running API operation (or potentionally queued task).

1. Generate request ID
2. Subscribe to Pusher events for this ID
3. Invoke API endpoint
4. Endpoint generates updates and send over [Pusher](https://pusher.com/) or other event message API
5. Show progress (messages or progress bar)
6. Receive response

Obviously this is just for experimentation purposes. Currently, client side is subscribed to all events and filters them on the client side.

### Queue implementation

The same approach can be implemented in queue processing. Task can notify all subscribes about it current progress by sending events with a correlation ID.
