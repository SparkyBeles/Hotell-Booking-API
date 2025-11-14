# Hotel Booking API

Serverless API for hotel bookings with AWS Lambda and DynamoDB.

## Prerequisites

- Node.js 20+
- AWS CLI configured
- Serverless Framework

## Installation

### Option 1: Local Installation

1. **Clone the project**
```bash
git clone https://github.com/SparkyBeles/Hotell-Booking-API.git
cd Hotell-Booking-API
```

2. **Install dependencies**
```bash
npm install
npm install -g serverless
```

3. **Create `.env` file**
```env
ORG=your-serverless-org
PROFILE=default
IAM_Role=your-iam-role-arn
```

4. **Deploy**
```bash
serverless deploy
```

### Option 2: Docker

1. **Clone the project**
```bash
git clone https://github.com/SparkyBeles/Hotell-Booking-API.git
cd Hotell-Booking-API
```

2. **Create `.env` file**
```env
ORG=your-serverless-org
PROFILE=default
IAM_Role=your-iam-role-arn
```

3. **Build and deploy with Docker**
```bash
docker build -t hotel-api .
docker run -it --rm -v ~/.aws:/root/.aws -v $(pwd):/app hotel-api serverless deploy
```

## API Endpoints
  ```bash
  https://km2xwjh02j.execute-api.eu-north-1.amazonaws.com/
  ```

  ```bash
  https://vz825rs8k1.execute-api.eu-north-1.amazonaws.com/
  ```

- `POST /bookings` - Create booking
    ```bash
  {"name": "jacob ",
  "email": "jacob@example.com",
  "guests": 2,
  "roomType": "single",
  "checkInDate": "2025-11-20",
  "checkOutDate": "2025-11-25"}
  ```
  
- `GET /bookings` - Get bookings
- `DELETE /bookings/{id}` - Delete booking
   ### Rooms are created only once, during the first deployment; the maximum number of rooms is 20.
- `POST /rooms` - Create room

## DynamoDB Tables

- `hotell-Bookings` - Bookings (roomId, bookingId)
- `hotell-Rooms` - Rooms (roomId)
 
