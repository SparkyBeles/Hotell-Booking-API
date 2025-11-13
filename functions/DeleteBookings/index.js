const { sendResponse } = require("../../response/index.js");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("DeleteBookings lambda started");

  try {
    const { id } = event.pathParameters || {};

    if (!id) {
      return sendResponse(400, {
        success: false,
        message: "Booking ID is required in the path (/bookings/{id})"
      });
    }

  const command = new DeleteCommand({
    TableName: "hotell-Bookings",
    Key: { bookingId: id },
    ReturnValues: "ALL_OLD",
  });
  const getCommand = new GetCommand({
      TableName: "hotell-Bookings",
      Key: { bookingId: id },
    // Find the booking by querying the BookingIdIndex GSI on bookingId
    const findBookingCmd = new QueryCommand({
      TableName: "hotell-Bookings",
      IndexName: "BookingIdIndex",      // search using GSI
      KeyConditionExpression: "#bookingId = :id",
      ExpressionAttributeNames: {
        "#bookingId": "bookingId",
      },
      ExpressionAttributeValues: {
        ":id": id,
      },
      Limit: 1, // there should be at most one booking with this id
    });

    const { Items } = await  db.send(findBookingCmd);

    if (!Items || Items.length === 0) {
      return sendResponse(404, {
        success: false,
        message: `No booking found with ID ${id}`,
      });
    }

    const booking = Items[0];
    const { roomId, bookingId, checkInDate, checkOutDate } = booking;

    // Do not allow delete if check-in is 2 days away or closer
    const todaysDate = new Date().toISOString().split("T")[0];

    if (checkInDate) {
      const today = new Date(todaysDate)
      const checkIn = new Date(checkInDate)

      const differenceInDays = Math.floor(
          (checkIn - today) / (1000 * 60 * 60 * 24)
      );

      console.log("Difference in days:", differenceInDays);
      console.log(today, checkIn);

      if (differenceInDays <= 2) {
        return sendResponse(500, {
          success: false,
          message: "You can't delete booking so close to check in."
        });
      }
    }

    if (!roomId || !bookingId) {
      // This should not happen if PostBooking saved correctly
      return sendResponse(500, {
        success: false,
        message: "Booking record is missing roomId or bookingId; cannot delete safely"
      });
    }
    // Deletes the booking confirmation from hotell-Bookings
    const deleteBookingCmd = new DeleteCommand({
      TableName: "hotell-Bookings",
      Key: {
        roomId: roomId,
        bookingId: bookingId,
      },
      ReturnValues: "ALL_OLD",
    });

    const deleteResult = await db.send(deleteBookingCmd)

    // Attempts to remove the booking from the room's bookings[] list
    try {
      const getRoomCmd = new GetCommand({
        TableName: "hotell-Rooms",
        Key: {
          roomId: roomId,
        },
      })

      const { Item: room } = await db.send(getRoomCmd);

      if (room && Array.isArray(room.bookings)) {
        // Filter out this booking from the room.bookings array
        const updatedBookings = room.bookings.filter(
            (b) =>
                !(
                    b.checkIn === checkInDate &&
                    b.checkOut === checkOutDate
                )
        );

        const updateRoomCmd = new UpdateCommand({
          TableName: "hotell-Rooms",
          Key: {
            roomId: roomId,
          },
          UpdateExpression: "SET bookings = :bookings",
          ExpressionAttributeValues: {
            ":bookings": updatedBookings,
          },
        });

        await db.send(updateRoomCmd);
      }

    // If updating the room fails, we still return success but log the error.
    // In that case, only the confirmation is deleted, not the room's bookings[] entry.
    } catch (innerError) {
      console.error(
          "Failed to update hotell-Rooms for deleted booking:",
          innerError
      );
    }

    return sendResponse(200, {
      success: true,
      message: "Booking was successfully deleted!",
      deletedBooking: deleteResult.Attributes || booking,
    });

  } catch (error) {
    console.error("Error in DeleteBookings:", error)
    return sendResponse(500, {
      success: false,
      message: "Could not delete booking",
      error: error.message,
    });
  }
};
