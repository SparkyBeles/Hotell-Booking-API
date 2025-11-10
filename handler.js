const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = hotell-db;

exports.createBooking = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const { name, email, guests, roomTypes, checkInDate, checkOutDate } = data;

    if (!name || !email || !guests || !roomTypes || !checkInDate || !checkOutDate) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const bookingId = uuidv4();
    const totalNights = (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24);

    const roomPrices = { enkelrum: 500, dubbelrum: 1000, svit: 1500 };
    let totalAmount = 0;
    for (const room of roomTypes) {
      if (!roomPrices[room.type]) return { statusCode: 400, body: JSON.stringify({ error: "Invalid room type" }) };
      totalAmount += room.quantity * roomPrices[room.type] * totalNights;
    }

    const newBooking = {
      id: bookingId,
      name,
      email,
      guests,
      roomTypes,
      checkInDate,
      checkOutDate,
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    await dynamo.put({ TableName: TABLE_NAME, Item: newBooking }).promise();

    return { statusCode: 201, body: JSON.stringify({ message: "Booking created", booking: newBooking }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not create booking" }) };
  }
};