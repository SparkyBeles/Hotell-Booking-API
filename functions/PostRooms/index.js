const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../../response/index.js');

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const rooms = [
      { roomId: "room-1",  roomType: "single", bookings: [] },
      { roomId: "room-2",  roomType: "single", bookings: [] },
      { roomId: "room-3",  roomType: "single", bookings: [] },
      { roomId: "room-4",  roomType: "single", bookings: [] },
      { roomId: "room-5",  roomType: "single", bookings: [] },
      { roomId: "room-6",  roomType: "single", bookings: [] },
      { roomId: "room-7",  roomType: "single", bookings: [] },
      { roomId: "room-8",  roomType: "single", bookings: [] },
      { roomId: "room-9",  roomType: "single", bookings: [] },
      { roomId: "room-10", roomType: "single", bookings: [] },
      { roomId: "room-11", roomType: "double", bookings: [] },
      { roomId: "room-12", roomType: "double", bookings: [] },
      { roomId: "room-13", roomType: "double", bookings: [] },
      { roomId: "room-14", roomType: "double", bookings: [] },
      { roomId: "room-15", roomType: "double", bookings: [] },
      { roomId: "room-16", roomType: "suite", bookings: [] },
      { roomId: "room-17", roomType: "suite", bookings: [] },
      { roomId: "room-18", roomType: "suite", bookings: [] },
      { roomId: "room-19", roomType: "suite", bookings: [] },
      { roomId: "room-20", roomType: "suite", bookings: [] }
    ];

    for (const room of rooms) {
      const command = new PutCommand({
        TableName: 'hotell-Rooms',
        Item: room,
      });
      await db.send(command);
    }

    return sendResponse(200, {
          success: true,
          message: 'Rooms pushed to database!',
        })

  } catch (error) {

    return sendResponse(500, {
          success: false,
          message: 'Rooms not pushed to database...',
          error: error.message
        })
  }
};
