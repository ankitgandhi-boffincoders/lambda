const express = require("express");
const AWS = require("aws-sdk");

AWS.config.update({
  region: "ap-south-1",
});
var docClient = new AWS.DynamoDB.DocumentClient();
var dynamodb = new AWS.DynamoDB();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//GET
app.get("/hello", (req, res) => {
  res.status(200).send("hello world!");
});

//GET req Simply sends the current time
app.post("/time", (req, res) => {
  let timeNow =  new Date();
  res.status(200).send(timeNow);
});

//POST req logs the name and sends it
//To check send a POST req with "name" and check your lambda function console
app.post("/logthis", async (req, res) => {
  const name = req.body.name;
  const toLog = `\n >>> My name is ${name} <<< \n`;
  console.info(toLog);
  res.status(200).send(toLog);
});

app.get("/tableList",  async(req, res) => {
  var params = {};
    let result;
    dynamodb.listTables(params, function (err, data) {
      if (err) {
        console.error(
          "Unable to create table. Error JSON:",
          JSON.stringify(err, null, 2)
        );
      } else {
       
        console.log(
          "Created table. Table description JSON:",
          JSON.stringify(data, null, 2)
        );
      }
    });
 
});

app.post("/add_table", async (req, res) => {
  var paramsNew = {
    TableName: req.body.table_name,
    KeySchema: [
      { AttributeName: "year", KeyType: "HASH" }, //Partition key
      { AttributeName: "title", KeyType: "RANGE" }, //Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "year", AttributeType: "N" },
      { AttributeName: "title", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
  };

   let result=dynamodb.createTable(paramsNew, (err, data) => {
     if (err) {
       errorFlag = true;
       errorResult = JSON.stringify(err, null, 2);
     } else {
       console.log(data);
       finalOutput = `${JSON.stringify(data, null, 2)}`;
     }
   });
   if(!errorFlag)
  res.status(200).send({status:"true",data:result});
  else
  res.status(400).send({status:"false",data:errorResult});
});



app.get("/allItems", async () => {
  

  let params = {
    TableName: req.body.table_name,
    
  }

  try {

    const scanResults = [];
    var items;
    do{
        items =  await docClient.scan(params).promise();
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey  = items.LastEvaluatedKey;
    }while(typeof items.LastEvaluatedKey !== "undefined");
    
    //return scanResults;
    res.status(200).send({status:"true",data:scanResults});
    // let result = await dynamodb.getItem(params).promise();

    // console.log(result);

    // return {
    //   body: JSON.stringify({
    //     message: "Executed succesfully",
    //     data: result
    //   })
    // }
  } catch (error) {
    console.log(error);
  }
}
)

module.exports = app;
