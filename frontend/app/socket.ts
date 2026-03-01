import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

// Singleton socket instance
let socket: Socket | null = null;
let connectionAttempted = false;

export const getSocket = () => {
  if (!socket && !connectionAttempted) {
    connectionAttempted = true;
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    console.log('Socket instance created');
  }
  return socket;
};

export const useSocket = (eventId?: string) => {
  const [socket] = useState(() => getSocket());
  const [availableSeats, setAvailableSeats] = useState<number | null>(null);
  const joinedRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log('Socket connected, id:', socket.id);
      if (eventId) {
        socket.emit('joinEvent', eventId);
        joinedRoomRef.current = eventId;
        console.log('Joined room event-', eventId);
      }
    };

    const onDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      joinedRoomRef.current = null;
    };

    const onConnectError = (err: any) => {
      console.error('Socket connection error:', err);
    };

    const onSeatUpdate = (data: { eventId: string; availableSeats: number }) => {
      console.log('Seat update received:', data);
      if (data.eventId === eventId) {
        setAvailableSeats(data.availableSeats);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('seatUpdate', onSeatUpdate);

    // If socket already connected, join room immediately
    if (socket.connected && eventId && joinedRoomRef.current !== eventId) {
      if (joinedRoomRef.current) {
        socket.emit('leaveEvent', joinedRoomRef.current);
      }
      socket.emit('joinEvent', eventId);
      joinedRoomRef.current = eventId;
      console.log('Already connected, joined room event-', eventId);
    }

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Don't remove all listeners on unmount – we want to keep socket for other components.
      // Instead, leave the room if eventId changes.
      if (eventId && socket.connected) {
        socket.emit('leaveEvent', eventId);
        joinedRoomRef.current = null;
      }
      // Remove only the specific listeners
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('seatUpdate', onSeatUpdate);
    };
  }, [eventId, socket]);

  return { availableSeats };
};