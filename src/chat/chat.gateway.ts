import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  wsClients = [];
  @WebSocketServer() server: Server;

  async handleConnection(@ConnectedSocket() client: Socket): Promise<any> {
    this.wsClients.push(client);
    client.on('join', (data) => {
      client.join(data);
    });
    //this.server.emit('connected', this.wsClients.length);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket): Promise<any> {
    this.wsClients = this.wsClients.filter((item) => item != client);
    client.on('leave', (data) => {
      client.leave(data);
    });
    //this.server.emit('disconnected', this.wsClients.length);
  }

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody() data: any,
    //@ConnectedSocket() client: Socket,
  ): Promise<any> {
    this.server.to(data.room).emit('chat', data);
  }
}
