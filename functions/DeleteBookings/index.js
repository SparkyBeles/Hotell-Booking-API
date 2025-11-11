const { sendResponse } =require('../../response/index.js');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DeleteCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {

    const { id } = event.pathParameters;

    const command = new DeleteCommand({
        TableName: 'hotell-db',
        Key: { id: id },
        ReturnValues: 'ALL_OLD'
    });

    try {

       const deleting = await db.send(command)

        if(!deleting.Attributes) {
            return sendResponse(404, { success : false, message : 'No booking found to delete'})
        }

        return sendResponse(200, { success : true, message : 'Booking was successfully deleted!', deletedBooking: deleting.Attributes })

    } catch(error) {

        return sendResponse(500, { success : false, message: 'could not delete booking', error: error.message});

    }
} 