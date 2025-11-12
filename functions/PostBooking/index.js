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

// Maximum o
const Hotel_Rooms =[
    // 5 Double rooms.  // 10 single rooms  // 5 Suite rooms
   "double_room-1.1","double_room-1.2","double_room-1.3","double_room-1.4", "double_room-1.5",
   "Single_room-2.1", "Single_room-2.2", "Single_room-2.3","Single_room-2.4","Single_room-2.5","Single_room-2.6","Single_room-2.7","Single_room-2.8","Single_room-2.9","Single_room-2.10",
   "suite_room-3.1","suite_room-3.2","suite_room-3.3","suite_room-3.4","suite_room-3.5",
]


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

        // temporary id for rooms for test purpose.
        const roomId = `${roomType.toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`;

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
            bookingNumber: bookingId,
            guestName: name,
            guests: guests,
            rooms: numberOfRooms,
            totalAmount: totalAmount,
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