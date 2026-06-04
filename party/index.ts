import type * as Party from "partykit/server";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

const messageSync = 0;
const messageAwareness = 1;

export default class YjsServer implements Party.Server {
  private doc: Y.Doc;
  private awareness: awarenessProtocol.Awareness;
  private connClients = new Map<string, Set<number>>();
  private loaded = false;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.awareness.setLocalState(null);

    this.doc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin === this) return;
      this.debouncePersist();

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const buf = encoding.toUint8Array(encoder);

      const without = (origin && typeof origin === "object" && "id" in origin)
        ? [(origin as Party.Connection).id]
        : undefined;
      this.room.broadcast(buf, without);
    });

    this.awareness.on("update", ({ added, updated, removed }, origin: unknown) => {
      const changed = [...added, ...updated, ...removed];
      if (changed.length === 0) return;

      if (origin && typeof origin === "object" && "id" in origin) {
        const clients = this.connClients.get((origin as Party.Connection).id);
        if (clients) {
          for (const id of added) clients.add(id);
          for (const id of removed) clients.delete(id);
        }
      }

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed)
      );
      const buf = encoding.toUint8Array(encoder);

      const without = (origin && typeof origin === "object" && "id" in origin)
        ? [(origin as Party.Connection).id]
        : undefined;
      this.room.broadcast(buf, without);
    });
  }

  async onStart() {
    await this.loadFromStorage();
  }

  private async loadFromStorage() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const data = await this.room.storage.get("doc:state");
      if (data) {
        Y.applyUpdate(this.doc, new Uint8Array(data as ArrayBuffer), this);
      }
    } catch (e) {
      console.error("Failed to load document:", e);
    }
  }

  private debouncePersist() {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(async () => {
      try {
        const state = Y.encodeStateAsUpdate(this.doc);
        await this.room.storage.put("doc:state", state);
      } catch (e) {
        console.error("Failed to persist:", e);
      }
    }, 2000);
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    if (!this.loaded) await this.loadFromStorage();
    this.connClients.set(conn.id, new Set());

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, this.doc);
    conn.send(encoding.toUint8Array(encoder));

    const states = this.awareness.getStates();
    if (states.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, [...states.keys()])
      );
      conn.send(encoding.toUint8Array(encoder));
    }

    conn.addEventListener("message", (event: MessageEvent) => {
      this.handleMessageEvent(conn, event);
    });

    conn.addEventListener("close", () => {
      this.handleClose(conn);
    });
  }

  private async handleMessageEvent(conn: Party.Connection, event: MessageEvent) {
    let buffer: ArrayBuffer;
    if (event.data instanceof ArrayBuffer) {
      buffer = event.data;
    } else if (event.data instanceof Blob) {
      buffer = await event.data.arrayBuffer();
    } else if (ArrayBuffer.isView(event.data)) {
      buffer = event.data.buffer.slice(event.data.byteOffset, event.data.byteOffset + event.data.byteLength);
    } else {
      return;
    }
    if (buffer.byteLength === 0) return;
    this.handleMessage(conn, new Uint8Array(buffer));
  }

  private handleClose(conn: Party.Connection) {
    const clients = this.connClients.get(conn.id);
    if (clients && clients.size > 0) {
      awarenessProtocol.removeAwarenessStates(this.awareness, [...clients], null);
    }
    this.connClients.delete(conn.id);
  }

  private handleMessage(conn: Party.Connection, message: Uint8Array) {
    try {
      const decoder = decoding.createDecoder(message);
      const type = decoding.readVarUint(decoder);

      switch (type) {
        case messageSync: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.readSyncMessage(decoder, encoder, this.doc, conn);
          if (encoding.length(encoder) > 1) {
            conn.send(encoding.toUint8Array(encoder));
          }
          break;
        }
        case messageAwareness: {
          const data = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(this.awareness, data, conn);
          break;
        }
      }
    } catch (e) {
      console.error("Error handling message:", e);
    }
  }
}
