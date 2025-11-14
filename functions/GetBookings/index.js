const { sendResponse } =require('../../response/index.js');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { ScanCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');


const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {

 const command = new ScanCommand({
      TableName: 'hotell-Bookings',
      //Filtrerar ut bookingId
      FilterExpression: "attribute_exists(#bookingId)",
      ExpressionAttributeNames: {
        "#bookingId" : "bookingId"
      }
    });

    try {
        const { Items } = await db.send(command);
        
        return sendResponse(200, {success : true, bookings : Items});

    } catch(error) {

      return sendResponse(500, {success : false, error: error.message});
    }
   
}