//Post

const { v4: uuidv4 } = require("uuid");
const { sendResponse } = require("../../response/index.js");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  PutCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
  ScanCommand
} = require("@aws-sdk/lib-dynamodb");

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


const MAX_GUESTS_PER_ROOM = {
    single: 1,
    double: 2,
    suite: 4
};

/**
 * Check if the room is available the dates the guest wants to book or not. 
 */
function isRoomAvailable(room, checkInDate, checkOutDate) {
  
  // All bookings of said room (or no bookings at all)
  const bookings = room.bookings || [];

  const newCheckIn = new Date(checkInDate);
  const newCheckOut = new Date(checkOutDate);

  // Loop through all the bookings of the room and change the checkin and checkout dates to Date().
  for (const booking of bookings) {
    const existingCheckIn = new Date(booking.checkIn);
    const existingCheckOut = new Date(booking.checkOut);

    //Compares the existing bookings with the dates the guest wants to stay. 
    //"If guest's checkout is not before (or same day as) existing checkIn or guest checkIn is not after (or same day as) existing checkOut" = overlapping dates.
    if (!(newCheckOut <= existingCheckIn || newCheckIn >= existingCheckOut)) {
      return false;
    }
  }
  return true;

}

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    console.log(data)

    const { name, email, guests, roomType, checkInDate, checkOutDate } = data;

    if (
      !name ||
      !email ||
      !guests ||
      !roomType ||
      !checkInDate ||
      !checkOutDate
    ) {
      return sendResponse(400, {
        success: false,
        message: "All fields are required!",
      });
    }
    // check if checkIn and checkOut is the same day (not allowed!)
    if(checkInDate === checkOutDate) {
        return sendResponse(400, {
        success: false,
        message: "Check in and check out can't be same day. Please change your dates.",
      });
    }

    // Calculates how many nights a guest is staying
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    let nights = Math.round((checkOut - checkIn) / msPerDay);
    if (nights < 1) {
      nights = 1; // sets the minimum to one night
    }
    // Check if checkout date is before checkin date (not allowed (or even possible...))
    if (checkIn > checkOut) {
        return sendResponse(400, {
        success: false,
        message: "You can't check in after check out. Please change your dates.",
      });
    }

    const todaysDate = new Date().toISOString().split("T")[0];
    const today = new Date(todaysDate);
    // Checkout date or check in date is before today's date (not possible)
    if (checkIn < today || checkOut < today ) {
        return sendResponse(400, {
        success: false,
        message: "Your dates have aldready passed. Please change your dates.",
      });

    }

    // price per night from room type
    const pricePerNight = ROOM_PRICES[roomType.toLowerCase()] || 0;

    const numberOfRooms = 1; //TODO there should be more than one room type, plus multiple rooms should be bookable
    const totalAmount = pricePerNight * nights * numberOfRooms;
    const bookingId = uuidv4();
    
    //Get the roomType (single, double, suite) from database
    const scanRooms = new ScanCommand({
      TableName: "hotell-Rooms",
      FilterExpression: "roomType = :type",
      ExpressionAttributeValues: { ":type": roomType.toLowerCase() },
    });

    const roomResult = await db.send(scanRooms);

    if (!roomResult.Items || roomResult.Items.length === 0) {
      return sendResponse(400, {
        success: false,
        message: `No ${roomType} in system`,
      });
    }


    try {
        const data = JSON.parse(event.body);

        const { name, email, guests, roomType, checkInDate, checkOutDate } = data;

        if (!name || !email || !guests || !roomType || !checkInDate || !checkOutDate) {
            return sendResponse(400, { success: false, message: 'All fields are required!' });
        }

        const maxGuests = MAX_GUESTS_PER_ROOM[roomType.toLowerCase()] || 0;
        const numberOfRooms = Math.ceil(guests / maxGuests);

        if (guests > maxGuests * numberOfRooms) {
            return sendResponse(400, {
                success: false,
                message: 'Too many guests for ${roomType} room(s). Max ${maxGuests} guests per room.',
            });
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

        const totalAmount = pricePerNight * nights * numberOfRooms;

        const bookingId = uuidv4();



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

    let availableRoom = null;
    //Loop through all the rooms of wanted roomType and every room is checked to see if it is available to be booked (or until an available room is found).
    for (const room of roomResult.Items) {
      if (isRoomAvailable(room, checkInDate, checkOutDate)) {
        availableRoom = room;
        break;
      }

    }

    if (!availableRoom) {
      return sendResponse(400, {
        success: false,
        message: `All ${roomType}-rooms are unavailable.`,
      });
    }

    // The guest's dates are added to the bookings-list of the room.
    const addBooking = new UpdateCommand({
      TableName: "hotell-Rooms",
      Key: { roomId: availableRoom.roomId },
      UpdateExpression:
        " SET bookings = list_append(if_not_exists(bookings, :empty), :new)",
      ExpressionAttributeValues: {
        ":new": [{ checkIn: checkInDate, checkOut: checkOutDate }],
        ":empty": [],
      },
    });

    await db.send(addBooking);

    //roomId is the same as the available rooms Id. 
    const roomId = availableRoom.roomId;

    // temporary id for rooms for test purpose.
    // const roomId = `${roomType.toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`;

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
      TableName: "hotell-Bookings",
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
      message: "Booking created successfully!",
      booking, // our saved booking
      confirmation, // confirmation client should get
    });
  } catch (error) {
    return sendResponse(500, {
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};
