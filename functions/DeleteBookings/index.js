const { sendResponse } = require("../../response/index.js");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {

    console.log("Lambda started");

  const { id } = event.pathParameters;

  const command = new DeleteCommand({
    TableName: "hotell-db-v2",
    Key: { id: id },
    ReturnValues: "ALL_OLD",
  });

  try {
    const deleting = await db.send(command);

    if (!deleting.Attributes) {
      return sendResponse(404, {
        success: false,
        message: "No booking found to delete",
      });
    }

    const todaysDate = new Date().toISOString().split("T")[0];
    const checkInDate = deleting.Attributes.checkInDate;


    console.log(todaysDate, checkInDate)

    if (checkInDate === todaysDate) {
      return sendResponse(500, {
        success: false,
        message: "You can't delete booking so soon to check in."
      });
    } else {

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
