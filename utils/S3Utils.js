const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const resizeImg = require('resize-img');


const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;
const bucketName = process.env.S3_BUCKET_NAME;
const region = process.env.S3_REGION;

async function readStreamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
        });
        stream.on('error', (error) => {
            reject(error);
        });
    });
}

async function _resizeImage(fileBuffer, isBanner) {
    let maxWidth;
    let maxHeight;

    if (isBanner) {
        maxWidth = 1500;
        maxHeight = 500;
    } else {
        maxWidth = 400;
        maxHeight = 400;
    }

    const buf = await readStreamToBuffer(fileBuffer);
    const resizedBuffer = await resizeImg(buf, { width: maxWidth, height: maxHeight });
    return resizedBuffer;
}

const UploadImage = async (fileName, fileStream) => {
    const resizedImage = await _resizeImage(fileStream, fileName.includes('banner'));

    const s3Client = new S3Client({
        credentials: {
            accessKeyId,
            secretAccessKey
        },
        region: region
    });

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: resizedImage,
        ACL: 'public-read',
        ContentType: 'image/jpeg'
    };

    const command = new PutObjectCommand(params);

    try {
        await s3Client.send(command);
        const imageUrl = `https://${bucketName}.s3-${region}.amazonaws.com/${fileName}`;
        return imageUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }

    // elasticbeanstalk-us-west-1-726751925359
}

module.exports = {
    UploadImage,
    //RetrieveImage
}

