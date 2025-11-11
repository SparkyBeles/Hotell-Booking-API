//Post

const { v4: uuidv4 } = require('uuid');
const { sendResponse } = require('../../response/index.js');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');


const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {

    try {
        const data = JSON.parse(event.body);

        const { name, email, guests, roomType, checkInDate, checkOutDate } = data;

        if (!name || !email || !guests || !roomType || !checkInDate || !checkOutDate) {
            return sendResponse(400, { success: false, message: 'All fields are required!' });
        }

        const bookingId = uuidv4();

        const booking = {
            id: bookingId,
            name,
            email,
            guests,
            roomType,
            checkInDate,
            checkOutDate,
            createdAt: new Date().toISOString(),
        };

        const command = new PutCommand({
            TableName: 'hotell-db-v2',
            Item: booking,
        });

        await db.send(command);

        return sendResponse(200, {
            success: true,
            message: 'Booking created successfully!',
            booking,
        });

    } catch (error) {
        return sendResponse(500, {
            success: false,
            message: 'Failed to create booking',
            error: error.message,
        });
    }
};