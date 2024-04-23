import express from "express";
import cors from "cors";
import Redis from "redis";

const redisClient = Redis.createClient(); // Corrected
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const EXPIRY_LIMIT = 10; // Define expiry limit (in seconds)

app.get('/', (req, res) => {
    res.send('Hello World');
});

(async () => {
    await redisClient.connect();
})();


//start redis-cli and redis-server on wsl terminal in vscode ,
//if redis-server does not work thn, 

redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', (err) => console.log('Redis Client Connection Error', err));

app.get('/data', async (req, res) => {
    redisClient.set("dev", JSON.stringify({
        medsh: "jg",
        jg: "wkjg"
    }), {EX: EXPIRY_LIMIT});
    //set expiry like this

    const datax = await redisClient.exists("dev");
    const dataxy = await redisClient.get("dev");
    console.log(datax,dataxy);
    res.json({message : "hq"})
});

app.listen(3000, () => { console.log("Listening to port 3000"); });
