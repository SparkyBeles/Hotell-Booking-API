//Post

const { v4: uuidv4 } = require('uuid');
const { sendResponse } = require('../../response/index.js');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, QueryCommand,DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

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

const HOTEL_ROOMS = {
    double: [
        "double_room-1.1", "double_room-1.2", "double_room-1.3", "double_room-1.4", "double_room-1.5"
    ],
    single: [
        "single_room-2.1", "single_room-2.2", "single_room-2.3", "single_room-2.4", "single_room-2.5",
        "single_room-2.6", "single_room-2.7", "single_room-2.8", "single_room-2.9", "single_room-2.10"
    ],
    suite: [
        "suite_room-3.1", "suite_room-3.2", "suite_room-3.3", "suite_room-3.4", "suite_room-3.5"
    ]
};

// Check if dates overlap
function datesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
}

// Find available room for the requested dates
async function findAvailableRoom(roomType, checkInDate, checkOutDate, db) {
    const rooms = HOTEL_ROOMS[roomType.toLowerCase()];
    
    if (!rooms || rooms.length === 0) {
        return null;
    }

    for (const roomId of rooms) {
        const command = new QueryCommand({
            TableName: 'hotell-Bookings',
            KeyConditionExpression: 'roomId = :roomId',
            ExpressionAttributeValues: {
                ':roomId': roomId
            }
        });

        const { Items } = await db.send(command);

        const isAvailable = !Items.some(booking => 
            datesOverlap(
                new Date(checkInDate),
                new Date(checkOutDate),
                new Date(booking.checkInDate),
                new Date(booking.checkOutDate)
            )
        );

        if (isAvailable) {
            return roomId;
        }
    }

    return null;
}


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

        // For now we only allow booking ONE room per request
        // so numberOfRooms is always 1 for this API version.
        const numberOfRooms = 1;

        const totalAmount = pricePerNight * nights * numberOfRooms;

        const bookingId = uuidv4(); // used in the confirmation notice and is saved to DynamoDB



        // Find available room
        const roomId = await findAvailableRoom(roomType, checkInDate, checkOutDate, db);

        if (!roomId) {
            return sendResponse(409, { 
                success: false, 
                message: `No available ${roomType} rooms for the selected dates` 
            });
        }

        const booking = {
            roomId: roomId,
            bookingId: bookingId,
            name,
            email,
            guests,
            roomType,
            checkInDate,
            checkOutDate,
            createdAt: new Date().toISOString(),
        };

        const command = new PutCommand({
            TableName: 'hotell-Bookings',
            Item: booking,
        });

        await db.send(command);

        // order confirmation
        const confirmation = {
            bookingID: bookingId,
            guestName: name,
            guests: guests,
            rooms: numberOfRooms,
            totalAmount: totalAmount,
            currency: "SEK",
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            roomId: roomId,
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