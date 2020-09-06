var aws = require("aws-sdk");
const fs = require("fs");

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET;

aws.config.update({
  region: "ap-south-1", // Put your aws region here
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const tableName = "redirect-db"; // Dynamo db table name.

const s3 = new aws.S3();

// Here I am using Dynamo to store the short urls of the s3 files
var docClient = new aws.DynamoDB.DocumentClient();

const uploadFile = (fileName) => {
  // Read content from the file
  const fileContent = fs.readFileSync(fileName);

  // Setting up S3 upload parameters
  const params = {
    Bucket: S3_BUCKET,
    Key: fileName, // File name you want to save as in S3
    Body: fileContent,
  };

  // Uploading files to the bucket
  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });
};

const sign_s3 = (req, res) => {
  const fileName = req.body.fileName;
  const fileType = req.body.fileType;

  // Set up the payload of what we are sending to the S3 api
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 500,
    ContentType: fileType,
    ACL: "public-read",
  };

  s3.getSignedUrl("putObject", s3Params, (err, data) => {
    if (err) {
      res.json({ success: false, error: err });
    }

    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`,
    };
    res.json({ success: true, data: { returnData } });
  });
};

const redirect = (req, res) => {
  const to = req.query.url;
  const short = req.query.short;
  if (!to) {
    return res.status(400).json({ message: "URL is required" });
  }
  if (!short) {
    return res.status(400).json({ message: "SHORT is required" });
  }
  docClient
    .put({
      TableName: tableName,
      Item: {
        short: short,
        to: to,
      },
    })
    .promise()
    .then(() => {
      res.json({ [short]: to });
    })
    .catch((err) => res.status(500).json(err));
};

const redirectTo = (req, res) => {
  const short = req.params.short;
  docClient
    .get({
      TableName: tableName,
      Key: {
        short: short,
      },
    })
    .promise()
    .then((result) => {
      if (result.Item && result.Item.to) {
        res.redirect(result.Item.to);
      } else {
        res.send("No short URL with " + short + " exists on the server");
      }
    })
    .catch((err) => res.status(500).json(err));
};

module.exports = { sign_s3, uploadFile, redirect, redirectTo };
