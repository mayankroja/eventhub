import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict to your frontend domain
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Client joins a room for a specific event
  @SubscribeMessage('joinEvent')
  handleJoinEvent(
    @MessageBody() eventId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`event-${eventId}`);
    console.log(`Client ${client.id} joined room event-${eventId}`);
  }

  // Client leaves a room (optional)
  @SubscribeMessage('leaveEvent')
  handleLeaveEvent(
    @MessageBody() eventId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`event-${eventId}`);
    console.log(`Client ${client.id} left room event-${eventId}`);
  }

  // Emit seat update to all clients in the event room
  emitSeatUpdate(eventId: string, availableSeats: number) {
    this.server.to(`event-${eventId}`).emit('seatUpdate', {
      eventId,
      availableSeats,
    });
  }
}
