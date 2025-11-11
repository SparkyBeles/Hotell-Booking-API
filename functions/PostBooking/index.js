//Post

const { v4: uuidv4 } = require('uuid');
const { sendResponse } = require('../../response/index.js');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// Pair coded by Youssef,camila,yuel.
const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

// Room price list
// Confirmation function pair coded by Elin and Emilia
const ROOM_PRICES = {
    single: 500,
    double: 1000,
    suite: 1500,
};


exports.handler = async (event) => {

    try {
        const data = JSON.parse(event.body);

        const { name, email, guests, roomType, checkInDate, checkOutDate } = data;

        if (!name || !email || !guests || !roomType || !checkInDate || !checkOutDate) {
            return sendResponse(400, { success: false, message: 'All fields are required!' });
        }

        // Calculates how many nights a guest is staying
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const msPerDay = 1000 * 60 * 60 * 24;
        let nights = Math.round((checkOut - checkIn) / msPerDay)
        if (nights < 1) {
            nights = 1; // sets the minimum to one night
        }

        // price per night from room type
        const pricePerNight = ROOM_PRICES[roomType.toLowerCase()] || 0;

        const numberOfRooms = 1; //TODO there should be more than one room type, plus multiple rooms should be bookable

        const totalAmount = pricePerNight * nights * numberOfRooms;

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

        // order confirmation
        const confirmation = {
            bookingNumber: bookingId,
            guestName: name,
            guests: guests,
            rooms: numberOfRooms,
            totalAmount: totalAmount,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
        };

        return sendResponse(200, {
            success: true,
            message: 'Booking created successfully!',
            booking,    // our saved booking
            confirmation,   // confirmation client should get
        });

    } catch (error) {
        return sendResponse(500, {
            success: false,
            message: 'Failed to create booking',
            error: error.message,
        });
    }
};