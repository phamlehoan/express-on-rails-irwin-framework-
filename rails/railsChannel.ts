import { Socket, Server as SocketServer } from "socket.io";

export abstract class RailsChannel {
  protected io: SocketServer;
  protected socket: Socket;

  constructor(io: SocketServer, socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  /**
   * This method is called when a client connects.
   * Override this to register event listeners for the socket.
   * @example
   * subscribe() {
   *   this.socket.on('join_room', (room) => this.join(room));
   *   this.socket.on('send_message', (data) => this.handleMessage(data));
   * }
   */
  abstract subscribe(): void;

  /**
   * Helper to join a room.
   * @param room The name of the room to join.
   */
  protected join(room: string) {
    this.socket.join(room);
  }

  /**
   * Helper to leave a room.
   * @param room The name of the room to leave.
   */
  protected leave(room: string) {
    this.socket.leave(room);
  }

  /**
   * Helper to broadcast an event to a specific room.
   * @param room The room to broadcast to.
   * @param event The event name.
   * @param data The data to send.
   */
  protected broadcastTo(room: string, event: string, ...data: any[]) {
    this.io.to(room).emit(event, ...data);
  }
}
