<div align= center> <h1>A simple API with serverless and DynomoDB for booking hotell room.</h1></div>

<h2>Prerequisites</h2>
<p>We assum you already have installed the AWS CLI,node.js, serverless and configured it.
  
```bash
 npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```
</p>

---
<h2>Install the project</h2>
Clone the repo

```bash
https://github.com/SparkyBeles/Hotell-Booking-API.git
```

 
 ```bash
install serverless -g
 ```

 ```bash
serverless -v
```

```bash
npm install serverless-dotenv-plugin --save-dev
```

---




<h3>Create .env file with this info in the project root folder the same as serverless yaml fil:
<h5> ORG=Your serverless user config </h5>
<h5> PROFILE=default </h5>


<h3>To deploy your serverless</h3>  

```bash
serverless deploy
```


# API Endpoints

<ul>
<li>Post</li>
<li>GET</li>
<li>DELETE</li>
<li>PUT</li>
</ol>

# Dynomodb Table
