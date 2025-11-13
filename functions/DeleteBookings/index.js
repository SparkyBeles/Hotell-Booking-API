const { sendResponse } = require("../../response/index.js");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {

    console.log("Lambda started");

  const { id } = event.pathParameters;

  const command = new DeleteCommand({
    TableName: "hotell-Bookings",
    Key: { bookingId: id },
    ReturnValues: "ALL_OLD",
  });
  const getCommand = new GetCommand({
      TableName: "hotell-Bookings",
      Key: { bookingId: id },
    });

  try {

    const getBooking = await db.send(getCommand);

     if (!getBooking.Item) {
      return sendResponse(404, {
        success: false,
        message: "No booking found to delete",
      });
    }

    //Get today's date and check in date.
    const todaysDate = new Date().toISOString().split("T")[0];
    const checkInDate = getBooking.Item.checkInDate;

    //Change time so both dates has the same time. 
    const today = new Date(todaysDate);
    const checkIn = new Date(checkInDate);


    const differenceInDays = Math.floor((checkIn - today) / (1000 * 60 * 60 * 24));

    console.log("Difference in days:", differenceInDays);
    console.log(today, checkIn)

    if (differenceInDays <= 2) {
      return sendResponse(500, {
        success: false,
        message: "You can't delete booking so soon to check in."
      });
    } else {

    const deleting = await db.send(command);

    return sendResponse(200, {
      success: true,
      message: "Booking was successfully deleted!",
      deletedBooking: deleting.Attributes,
    });
    }
  } catch (error) {
    return sendResponse(500, {
      success: false,
      message: "could not delete booking",
      error: error.message,
    });
  }
};
