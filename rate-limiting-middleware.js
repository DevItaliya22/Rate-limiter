import express from "express"
import cors from "cors"
import Redis from "redis"

const app = express();
app.use(cors());
const redisClient = Redis.createClient();

//start redis-cli and redis-server on wsl terminal in vscode ,
//if redis-server does not work then, 

(async () => {
    await redisClient.connect();
})();
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', (err) => console.log('Redis Client Connection Error', err));

function rateLimiter({secondWindow,allowedHits})
{
    // const ip = (req.headers["x-forwarded-for"] || req.connection.remoteAddress).slice(0,9) + req.url; //here use req.url if u want that
    // //each api should have diffrent rate limiting 
    // console.log(ip);

    return async function(req,res,next) 
    {
        const username = "Dev"+req.url;
        const requests = await redisClient.incr(username) 
        console.log("Number of req made so far by username is ",requests);
    
        let ttl = 0;
        if(requests===1)
        {
            await redisClient.expire(username,secondWindow)
            ttl = secondWindow;
        }
        else 
        {
            ttl = await redisClient.ttl(username)
        }
    
        if(requests>allowedHits)
        {
            return res.status(503).json({message:"Too many requests",calls:requests,ttl})
        }
        else{
            req.requests = requests;
            req.ttl = ttl;
            next();
        }
    }

}

app.get("/",(req,res)=>{
    res.json({message:"up and running"})
})

app.get("/api1",rateLimiter({secondWindow:10,allowedHits:5}),async(req,res)=>{
    //expensive funtion should be here so u dont do it multiple times
    res.json({message:"Expenive call",requestMade : req.requests,ttl:req.ttl})
})

app.get("/api2",rateLimiter({secondWindow:100,allowedHits:10}),async(req,res)=>{
    //expensive funtion should be here so u dont do it multiple times
    res.json({message:"Expenive call",requestMade : req.requests,ttl:req.ttl})
})

//here every url or api will have a new rate limiter , so api1 can habdle 5 req in 10 sec and api2 can handle 10 req in 100 sec
//now if u wanna do like whole server is one thing then remove req.url from ip address that is appended on ip or username , as we want 
// 1) unique identity of person/client => username/ip can do that
// 2) unique url of api so we appended both and made thata key and value id ttl

//wsl ubuntu will be seen after few second or 1-2 restarts , so dont panic it is there , just it will take time
// how to start this redis , go to wsl tern=minal in vs-code and the do redid-cli, redis-server
// if redis-server gives erroer then it might be on already so no worries else it will on it
// url of redis server http://localhost:6379/
// if this pafge says (This page isn’t working) (localhost didn’t send any data.)(ERR_EMPTY_RESPONSE)
// then it is runnign
// now how to stop  : sudo service redis-server stop will stop 
// and listen u can only start redis-cli after redis-server 

app.listen(3000,()=>{console.log("Server started on 3000");})