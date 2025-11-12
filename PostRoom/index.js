const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../../response/index.js');

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const { roomType, price, availableRooms } = data;

    if (!roomType || !price || !availableRooms) {
      return sendResponse(400, { success: false, message: "All fields are required!" });
    }

    const roomId = uuidv4();

    const room = {
      id: roomId,
      roomType,
      price,
      availableRooms,
      createdAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: 'rooms-db',
      Item: room
    });

    await db.send(command);

    return sendResponse(200, { success: true, message: "Room added successfully!", room });

  } catch (error) {
    return sendResponse(500, { success: false, message: error.message });
  }
};
