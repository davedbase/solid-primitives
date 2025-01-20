<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Websocket" alt="Solid Primitives Websocket">
</p>

# @solid-primitives/websocket

[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitive to help establish, maintain and operate a websocket connection.

- `makeWS` - sets up a web socket connection with a buffered send
- `createWS` - sets up a web socket connection that disconnects on cleanup
- `createWSState` - creates a reactive signal containing the readyState of a websocket
- `makeReconnectingWS` - sets up a web socket connection that reconnects if involuntarily closed
- `createReconnectingWS` - sets up a reconnecting web socket connection that disconnects on cleanup
- `makeHeartbeatWS` - wraps a reconnecting web socket to send a heart beat and reconnect if the answer fails

All of them return a WebSocket instance extended with a `message` prop containing an accessor for the last received message for convenience and the ability to receive messages to send before the connection is opened.

## How to use it

```ts
const ws = createWS("ws://localhost:5000");
const state = createWSState(ws);
const states = ["Connecting", "Connected", "Disconnecting", "Disconnected"];
ws.send("it works");
createEffect(on(ws.message, msg => console.log(msg), { defer: true }));
return <p>Connection: {states[state()]}</p>;

const socket = makeHeartbeatWS(
  makeReconnectingWS(`ws://${location.hostName}/api/ws`, undefined, { timeout: 500 }),
  { message: "👍" },
);
// with the primitives starting with `make...`, one needs to manually clean up:
socket.send("this will reconnect if connection fails");
```

### Definitions

```ts
/** Arguments of the primitives */
type WSProps = [url: string, protocols?: string | string[]];
type WSMessage = string | ArrayBufferLike | ArrayBufferView | Blob;
type WSReadyState = WebSocket.CONNECTING | WebSocket.OPEN | WebSocket.CLOSING | WebSocket.CLOSED;
type WSEventMap = {
  close: CloseEvent;
  error: Event;
  message: MessageEvent;
  open: Event;
};
type ReconnectingWebSocket = WebSocket & {
  reconnect: () => void;
  // ws.send.before is meant to be used by heartbeat
  send: ((msg: WSMessage) => void) & { before: () => void };
};
type WSHeartbeatOptions = {
  /**
   * Heartbeat message being sent to the server in order to validate the connection
   * @default "ping"
   */
  message?: WSMessage;
  /**
   * The time between messages being sent in milliseconds
   * @default 1000
   */
  interval?: number;
  /**
   * The time after the heartbeat message being sent to wait for the next message in milliseconds
   * @default 1500
   */
  wait?: number;
};
```

If you want to use the messages as a signal, have a look at the [`event-listener`](../event-listener/README.md) package:

```ts
import { createWS } from "@solid-primitives/websocket";
import { createEventSignal } from "@solid-primitives/event-listener";

const ws = createWS("ws://localhost:5000");
const messageEvent = createEventSignal(ws, "message");
const message = () => messageEvent().data;
```

Otherwise, you can simply use the message event to get message.data:

```ts
import { createStore } from "solid-js/store";
import { createReconnectingWS, WSMessage } from "@solid-primitives/websocket";

const ws = createReconnectingWS("ws://localhost:5000");
const [messages, setMessages] = createStore<WSMessage[]>();
ws.addEventListener("message", (ev) => setMessages(messages.length, ev.data));

<For each={() => messages}>
  {(message) => ...}
</For>
```

## Setting up a websocket server

While you can use this primitive with solid-start, it already provides a package for websockets that handles both the server and the client side:

```ts
import { createWebSocketServer } from "solid-start/websocket";
import server$ from "solid-start/server";

const pingPong = createWebSocketServer(
  server$(function (webSocket) {
    webSocket.addEventListener("message", async msg => {
      try {
        // Parse the incoming message
        let incomingMessage = JSON.parse(msg.data);
        console.log(incomingMessage);

        switch (incomingMessage.type) {
          case "ping":
            webSocket.send(
              JSON.stringify([
                {
                  type: "pong",
                  data: {
                    id: incomingMessage.data.id,
                    time: Date.now(),
                  },
                },
              ]),
            );
            break;
        }
      } catch (err: any) {
        // Report any exceptions directly back to the client. As with our handleErrors() this
        // probably isn't what you'd want to do in production, but it's convenient when testing.
        webSocket.send(JSON.stringify({ error: err.stack }));
      }
    });
  }),
);
```

Otherwise, in order to set up your own production-use websocket server, we recommend packages like

- nodejs: [`ws`](https://github.com/websockets/ws)
- rust: [`websocket`](https://docs.rs/websocket/latest/websocket/)

## Demo

You may view a working example here:
https://primitives.solidjs.community/playground/websocket/

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
