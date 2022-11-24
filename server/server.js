const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const dbService = require('./dbService')

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const db = dbService.getDbServiceInstance()
// create
app.post('/insert',async (request,response)=>{
  
  const result = db.regUserData(request.body)
  result
  .then(res => {
    console.log(res,'success');
    if(res.message === 'Email already exists'){
      return response.status(401).json({success: false})
    }
    return response.status(200).json({success: true,email: res.email,id: res.insertId})
  })
  .catch(err => {
    console.log(err)
  })
  
})

// read
app.get('/getAll',(request,response)=>{
  const result = db.getAllData();

  result
  .then(data => response.json({data: data}))
  .catch(err => console.log(err))
})


// update

app.patch('/checkToken',(request,response)=>{
  const result = db.checkToken(request.body.token);

  result
  .then(email => {
    console.log(email,'email');
    return response.json({email: email})
  })
  .catch(err => console.log(err))
})

app.patch('/authUser',(request,response)=>{
  console.log(request.body,'request body AUTH');
  const result = db.authUser(request.body);

  result
  .then(res => {
    console.log(res, 'res');
    if(res.token){
      return response.json({token: `Bearer ${res.token}`,email: res.email,id: res.id,success: true})
    }else{
      return response.status(401).json({success: false,message: res.message})
    }
  })
  .catch(err => console.log(err))
})
app.patch('/blockUser',(request,response)=>{
  // console.log(request.body,'request body BLOCK');
  const result = db.blockUser(request.body);

  result
  .then(res => {
    if(res){
      return response.json({success: res})
    }else{
      return response.status(404).json({success: res})
    }
  })
  .catch(err => console.log(err))
})
app.patch('/unblockUser',(request,response)=>{
  const result = db.unblockUser(request.body);

  result
  .then(res => {
    if(res){
      return response.json({success: res})
    }else{
      return response.status(404).json({success: res})
    }
  })
  .catch(err => console.log(err))
})

// delete

app.delete('/deleteUser',(request,response)=>{
  const result = db.deleteUser(request.body);

  result
  .then(res => {
    if(res){
      return response.json({success: res})
    }else{
      return response.status(404).json({success: res})
    }
  })
  .catch(err => console.log(err))
})

app.listen(process.env.PORT, (info)=>{
  console.log(info,'info');
  console.log('app is running');
})
