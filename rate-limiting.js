import express from "express"
import cors from "cors"
import Redis from "redis"

const app = express();
app.use(cors());
const redisClient = Redis.createClient();

//start redis-cli and redis-server on wsl terminal in vscode ,
//if redis-server does not work then, 

const EXPIRY_LIMIT = 10;//in seconds
const MAX_REQUESTS = 10; //max req in EXPIRY_LIMIT seconds after that u will get new slot
(async () => {
    await redisClient.connect();
})();
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', (err) => console.log('Redis Client Connection Error', err));



app.get("/",(req,res)=>{
    res.json({message:"up and running"})
})



app.get("/api1",async(req,res)=>{
    //here u wont get ip, but on produvtion ,on deploy u wil get it... , here i am using username as they are also unique
    // const ip = (req.headers["x-forwarded-for"] || req.connection.remoteAddress).slice(0,9);
    // console.log(ip);

    const username = "Dev";

    const requests = await redisClient.incr(username) // it means if key does not exist then give 1 simpy to val, else increment the val of that key 

    console.log("Number of req made so far by username is ",requests);
    //example 
//     Server started on 3000
// Redis Client Connected
// Number of req made so far by username is  1
// Number of req made so far by username is  2
// Number of req made so far by username is  3
// Number of req made so far by username is  4
// Number of req made so far by username is  5

//so now every 10 sec u will get 10 requests , after 10 sec new 10 req u can ake
    let ttl =0;
    if(requests===1)
    {
        await redisClient.expire(username,EXPIRY_LIMIT)
        ttl = EXPIRY_LIMIT;
    }
    else 
    {
        ttl = await redisClient.ttl(username)
    }

    if(requests>MAX_REQUESTS)
    {
        //no need to do expensive operations here as user is might be spamming
        return res.status(503).json({message:"Too many requests",calls:requests,ttl})
    }
    //do expensive function

    res.json({calls:requests,ttl})
})

app.get("/api2",async(req,res)=>{
    res.json({calls:1})
})

app.listen(3000,()=>{console.log("Server started on 3000");})