const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 4000;


// middleware
app.use(cors())
app.use(express.json())

// token verification
const verifyJWT = (req, res, next) =>{
  const authorization = req.header.authorization;
  if(!authorization){
    return res.send({message: "No Token"})
  }
  const token = authorization.split('')[1];
  jwt.verify(token, process.env.ACCESS_KEY_TOKEN,(err, decoded)=>{
    if(err){
      return res.send({message: "Invalid Token"})
    }
    req.decoded = decoded;
    next();
  })
}
// verify seller
const verifySeller = async(req, res, next)=>{
const email = req.decoded.email;
const query = {email: email};
const user = await userCollection.findOne(query)
if(user?.role !== 'seller'){
  return res.send({message: 'Forbidden access'})
}
next();
}

// mongodb

const url =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6dfffw4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const userCollection = client.db("GadgetShop").collection("users");
const productCollection = client.db("GadgetShop").collection("products");

const dbConnect = async () => {
  try{
   await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Get User

    app.get("/user/:email", async (req, res)=>{
      const query = {email: req.params.email}
      const user = await userCollection.findOne(query)
      // if(!user){
      //   return res.send({message: "No User Found"})
      // }
      res.send(user)
    })



    // insert users
    app.post("/users", async(req, res)=>{
      const user = req.body;
      const query = {email: user.email}
      const exitingUser = await userCollection.findOne(query);
      if(exitingUser){
        return res.send({message: "This user has already exist"});
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    // add product

    app.post("/addproducts", verifyJWT, verifySeller, async (req, res) =>{
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    })

  }catch(error){
    console.log(error.name, error.message)
  }
}
dbConnect();

// API

app.get('/', (req, res) =>{
  res.send('server is running')
})

// JWT

app.post('/authentication', async (req, res) =>{
  const userEmail = req.body;
  const token = jwt.sign(userEmail, process.env.ACCESS_KEY_TOKEN, {expiresIn: '10d'});
  res.send({token});
})


app.listen(port, ()=>{
  console.log(`Server is running on port ${port}`)
})
